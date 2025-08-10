// Floor Plan functionality
let currentTool = 'select';
let shapes = [];
let selectedShape = null;
let isDrawing = false;
let startX, startY;
let placedProducts = [];
let isDragging = false;
let draggedElement = null;
let dragOffsetX, dragOffsetY;
let canvas, ctx;
let isEditMode = true;

// Konva objects
let stage;
let layer;
let transformer;
let konvaShapes = [];
let currentZoom = 1;
let isDraggingStage = false;
let lastPointerPosition = null;

function openFloorPlan() {
    const modal = document.getElementById('floorPlanModal');
    modal.style.display = 'block';
    
    // Set location name
    const locationName = locations.find(loc => loc.id === currentLocation)?.name || 'Unknown Location';
    document.getElementById('floorPlanLocationName').textContent = locationName;
    
    // Reset state
    selectedShape = null;
    isDrawing = false;
    
    // Always start in select mode
    currentTool = 'select';
    
    // Update UI to show select as active
    document.querySelectorAll('.shape-button').forEach(button => {
        if (button.dataset.tool === 'select') {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
            button.classList.remove('delete-tool');
        }
    });
    
    // Initialize Konva stage
    initKonvaStage();
    
    // Load existing floor plan data
    loadFloorPlan(currentLocation);
    
    // Load products for placement
    loadProductsForPlacement();
    
    console.log('Floor plan opened, stage initialized');
}

function initKonvaStage() {
    // Check if stage already exists
    if (stage) {
        stage.destroy();
    }
    
    // Create Konva stage with the correct container ID
    stage = new Konva.Stage({
        container: 'floorPlanCanvas',
        width: 1000,
        height: 600
    });
    
    // Create layer for all shapes
    layer = new Konva.Layer();
    stage.add(layer);
    
    // Create transformer for shape manipulation
    transformer = new Konva.Transformer({
        nodes: [],
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        rotateEnabled: true,
        borderDash: [3, 3]
    });
    layer.add(transformer);
    
    // Add wheel event listener for zooming
    stage.on('wheel', (e) => {
        e.evt.preventDefault();
        
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        
        // Calculate new scale
        const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
        
        // Limit zoom level between 0.1 and 3
        if (newScale >= 0.1 && newScale <= 3) {
            stage.scale({ x: newScale, y: newScale });
            
            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            
            stage.position(newPos);
            stage.batchDraw();
            
            // Update zoom level display
            currentZoom = Math.round(newScale * 100);
            document.getElementById('zoomLevel').textContent = `${currentZoom}%`;
        }
    });

    // Add mouse events for stage dragging
    stage.on('mousedown', (e) => {
        // Don't start dragging if clicking on a shape or transformer
        if (e.target !== stage && e.target !== layer) {
            return;
        }

        // Only enable dragging if:
        // 1. We're in view mode (not edit mode), or
        // 2. The user is holding the shift key (for edit mode)
        if (!isEditMode || (isEditMode && e.evt.shiftKey)) {
            isDraggingStage = true;
            lastPointerPosition = stage.getPointerPosition();
            document.body.style.cursor = 'grabbing';
        }
    });

    stage.on('mousemove', (e) => {
        if (!isDraggingStage) {
            // Update cursor based on mode and shift key
            if (!isEditMode || (isEditMode && e.evt.shiftKey)) {
                document.body.style.cursor = 'grab';
            } else {
                document.body.style.cursor = 'default';
            }
            return;
        }

        if (!lastPointerPosition) {
            return;
        }

        e.evt.preventDefault();
        const pos = stage.getPointerPosition();
        const dx = pos.x - lastPointerPosition.x;
        const dy = pos.y - lastPointerPosition.y;

        // Move the stage
        stage.position({
            x: stage.x() + dx,
            y: stage.y() + dy
        });
        stage.batchDraw();

        lastPointerPosition = pos;
    });

    stage.on('mouseup', () => {
        isDraggingStage = false;
        lastPointerPosition = null;
        document.body.style.cursor = isEditMode ? 'default' : 'grab';
    });

    // Add keyboard event listener for shift key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift' && isEditMode) {
            document.body.style.cursor = 'grab';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift' && isEditMode) {
            document.body.style.cursor = 'default';
        }
    });
    
    // Ensure the layer is drawn
    layer.draw();
    
    // Set up event listeners
    setupKonvaEvents();
    
    console.log("Konva stage initialized with container:", stage.container());
}

function setupKonvaEvents() {
    // Clear only the click event listener, preserve stage dragging events
    stage.off('click');
    
    // Stage click handler for selection
    stage.on('click', function(e) {
        // Log the click for debugging
        console.log("Stage clicked", e.target, "current tool:", currentTool);
        
        // If clicked on empty stage
        if (e.target === stage) {
            transformer.nodes([]);
            selectedShape = null;
            layer.draw();
            return;
        }
        
        // Handle delete tool
        if (currentTool === 'delete') {
            try {
                const clickedShape = e.target;
                console.log("Attempting to delete shape:", clickedShape);
                
                // Remove from transformer
                transformer.nodes([]);
                
                // If it's a basic shape, remove from konvaShapes
                const shapeIndex = konvaShapes.indexOf(clickedShape);
                if (shapeIndex > -1) {
                    konvaShapes.splice(shapeIndex, 1);
                }
                
                // If it's a group with a product ID, remove from placedProducts
                if (clickedShape instanceof Konva.Group && clickedShape.attrs.productId) {
                    const productId = clickedShape.attrs.productId;
                    placedProducts = placedProducts.filter(p => p.productId !== productId);
                }
                
                // Delete the shape
                clickedShape.destroy();
                selectedShape = null;
                layer.draw();
                
                console.log("Shape deleted with delete tool, staying in delete mode");
                
                // No need to switch tools - stay in delete mode
                return;
            } catch (error) {
                console.error("Error deleting shape with delete tool:", error);
            }
        }
        
        if (currentTool === 'select') {
            // Don't select when clicking on transformer
            if (e.target.getParent() && e.target.getParent().className === 'Transformer') {
                return;
            }
            
            // Select the shape
            try {
                console.log("Selecting shape:", e.target);
                transformer.nodes([e.target]);
                selectedShape = e.target;
                layer.draw();
            } catch (error) {
                console.error("Error selecting shape:", error);
                // Reset transformer if there's an error
                transformer.nodes([]);
                selectedShape = null;
                layer.draw();
            }
        }
    });
    
    // Add drawing-specific event handlers that work alongside stage dragging
    // We'll use different event names to avoid conflicts
    stage.on('mousedown.draw', function(e) {
        console.log("Drawing mouse down, current tool:", currentTool, "isEditMode:", isEditMode);
        
        // Only handle drawing if we're in edit mode and using a drawing tool
        if (currentTool === 'select' || !isEditMode) return;
        
        // Don't start drawing if we're clicking on a shape (let the stage dragging handle it)
        if (e.target !== stage && e.target !== layer) return;
        
        isDrawing = true;
        const pos = stage.getPointerPosition();
        startX = pos.x;
        startY = pos.y;
        
        try {
            if (currentTool === 'rectangle') {
                console.log("Creating rectangle at", startX, startY);
                // Create new rectangle
                selectedShape = new Konva.Rect({
                    x: startX,
                    y: startY,
                    width: 0,
                    height: 0,
                    fill: document.getElementById('shapeColor').value,
                    stroke: '#000',
                    strokeWidth: 1,
                    draggable: true
                });
                
                // Add drag handlers to prevent transformer issues
                addDragHandlersToShape(selectedShape);
                
                layer.add(selectedShape);
                konvaShapes.push(selectedShape);
                layer.draw();
                
            } else if (currentTool === 'circle') {
                // Create new circle
                selectedShape = new Konva.Circle({
                    x: startX,
                    y: startY,
                    radius: 0,
                    fill: document.getElementById('shapeColor').value,
                    stroke: '#000',
                    strokeWidth: 1,
                    draggable: true
                });
                
                // Add drag handlers to prevent transformer issues
                addDragHandlersToShape(selectedShape);
                
                layer.add(selectedShape);
                konvaShapes.push(selectedShape);
                layer.draw();
                
            } else if (currentTool === 'text') {
                // Create new text
                const textContent = prompt("Enter text:", "Text");
                if (textContent) {
                    selectedShape = new Konva.Text({
                        x: startX,
                        y: startY,
                        text: textContent,
                        fontSize: 20,
                        fill: document.getElementById('shapeColor').value,
                        draggable: true
                    });
                    
                    // Add drag handlers to prevent transformer issues
                    addDragHandlersToShape(selectedShape);
                    
                    layer.add(selectedShape);
                    konvaShapes.push(selectedShape);
                    
                    // Select the new text
                    transformer.nodes([selectedShape]);
                    
                    // Switch to select tool immediately after placing text
                    setTimeout(function() {
                        selectTool('select');
                    }, 10);
                    
                    layer.draw();
                }
                isDrawing = false;
            }
        } catch (error) {
            console.error("Error creating shape:", error);
            isDrawing = false;
            selectedShape = null;
        }
    });
    
    // Handle mouse move for drawing
    stage.on('mousemove.draw', function(e) {
        if (!isDrawing || !selectedShape) return;
        
        const pos = stage.getPointerPosition();
        
        try {
            if (currentTool === 'rectangle' && selectedShape instanceof Konva.Rect) {
                const width = pos.x - startX;
                const height = pos.y - startY;
                
                selectedShape.width(width);
                selectedShape.height(height);
                layer.batchDraw();
                
            } else if (currentTool === 'circle' && selectedShape instanceof Konva.Circle) {
                const dx = pos.x - startX;
                const dy = pos.y - startY;
                const radius = Math.sqrt(dx * dx + dy * dy);
                
                selectedShape.radius(radius);
                layer.batchDraw();
            }
        } catch (error) {
            console.error("Error updating shape:", error);
            isDrawing = false;
        }
    });
    
    // Handle mouse up for finishing drawing
    stage.on('mouseup.draw', function() {
        console.log("Drawing mouse up detected, isDrawing:", isDrawing, "currentTool:", currentTool);
        
        // Only handle shape completion if we're in drawing mode
        if (!isDrawing) return;
        
        // Reset drawing state first
        isDrawing = false;
        
        // Handle completed shape
        if (selectedShape) {
            try {
                // Check if we should keep the shape based on its size
                let shouldKeepShape = true;
                
                if (selectedShape instanceof Konva.Rect && 
                    (Math.abs(selectedShape.width()) < 5 || Math.abs(selectedShape.height()) < 5)) {
                    shouldKeepShape = false;
                } else if (selectedShape instanceof Konva.Circle && selectedShape.radius() < 5) {
                    shouldKeepShape = false;
                }
                
                if (!shouldKeepShape) {
                    // Remove shapes that are too small
                    selectedShape.remove();
                    const index = konvaShapes.indexOf(selectedShape);
                    if (index > -1) {
                        konvaShapes.splice(index, 1);
                    }
                    selectedShape = null;
                } else {
                    // Select the shape we just drew
                    transformer.nodes([selectedShape]);
                }
                
                // Switch to select tool only if we were using a drawing tool
                // This ensures delete tool stays active
                if (['rectangle', 'circle', 'text'].includes(currentTool)) {
                    setTimeout(function() {
                        selectTool('select');
                    }, 10);
                }
                
                layer.draw();
            } catch (error) {
                console.error("Error finalizing shape:", error);
                // Reset state on error
                selectedShape = null;
                selectTool('select');
                layer.draw();
            }
        } else {
            // Even if there's no selected shape, still switch to select tool if using drawing tools
            if (['rectangle', 'circle', 'text'].includes(currentTool)) {
                selectTool('select');
            }
        }
    });
    
    console.log("Konva event handlers set up");
}

// Helper function to add consistent drag handlers to all shapes
function addDragHandlersToShape(shape) {
    // Clear any existing handlers to prevent duplicates
    shape.off('dragstart');
    shape.off('dragend');
    
    shape.on('dragstart', function() {
        console.log('Drag started on shape', shape);
        // Remove the transformer during drag to prevent errors
        transformer.nodes([]);
    });
    
    shape.on('dragend', function() {
        console.log('Drag ended on shape', shape, 'current tool:', currentTool);
        // Only add the transformer back if still in select mode
        if (currentTool === 'select') {
            transformer.nodes([shape]);
            selectedShape = shape;
            layer.draw();
        }
    });
    
    // Make sure the shape is clickable
    shape.listening(true);
}

function closeFloorPlan() {
    const modal = document.getElementById('floorPlanModal');
    modal.style.display = 'none';
}

async function loadFloorPlan(locationId) {
    try {
        console.log('Loading floor plan for location:', locationId);
        
        // Load floor plan data from IndexedDB
        const floorPlan = await db.get('floorPlans', locationId);
        
        if (floorPlan) {
            console.log('Floor plan data loaded:', floorPlan);
            shapes = floorPlan.shapes || [];
            placedProducts = floorPlan.placedProducts || [];
            
            // Clear Konva shapes
            konvaShapes = [];
            layer.destroyChildren();
            
            // Add transformer back
            layer.add(transformer);
            
            // Create Konva shapes from saved data
            shapes.forEach(shape => {
                let konvaShape;
                
                if (shape.type === 'rectangle') {
                    konvaShape = new Konva.Rect({
                        x: shape.x,
                        y: shape.y,
                        width: shape.width,
                        height: shape.height,
                        fill: shape.fill,
                        stroke: '#000',
                        strokeWidth: 1,
                        draggable: true
                    });
                } else if (shape.type === 'circle') {
                    konvaShape = new Konva.Circle({
                        x: shape.x,
                        y: shape.y,
                        radius: shape.radius,
                        fill: shape.fill,
                        stroke: '#000',
                        strokeWidth: 1,
                        draggable: true
                    });
                } else if (shape.type === 'text') {
                    konvaShape = new Konva.Text({
                        x: shape.x,
                        y: shape.y,
                        text: shape.text,
                        fontSize: 20,
                        fill: shape.fill,
                        draggable: true
                    });
                }
                
                if (konvaShape) {
                    layer.add(konvaShape);
                    konvaShapes.push(konvaShape);
                }
            });
            
            // Add placed products
            const placedProductsContainer = document.getElementById('placedProducts');
            placedProductsContainer.innerHTML = '';
            
            placedProducts.forEach(product => {
                const productText = new Konva.Text({
                    x: product.x,
                    y: product.y,
                    text: product.name,
                    fontSize: 14,
                    padding: 5,
                    fill: '#ffffff',
                    draggable: true,
                    id: 'product-' + product.productId
                });
                
                const productBox = new Konva.Rect({
                    x: product.x,
                    y: product.y,
                    width: productText.width(),
                    height: productText.height(),
                    fill: '#2196F3',
                    opacity: 0.7,
                    cornerRadius: 3,
                    draggable: true
                });
                
                // Group product text and box
                const productGroup = new Konva.Group({
                    draggable: true,
                    productId: product.productId
                });
                
                productGroup.add(productBox);
                productGroup.add(productText);
                layer.add(productGroup);
            });
            
            layer.draw();
        } else {
            console.log('No floor plan found for location:', locationId);
            // Create empty floor plan
            shapes = [];
            placedProducts = [];
            layer.draw();
        }
    } catch (error) {
        console.error('Error loading floor plan:', error);
        alert('Error loading floor plan: ' + error.message);
        shapes = [];
        placedProducts = [];
        layer.draw();
    }
}

async function saveFloorPlan() {
    try {
        // Export Konva shapes to simple objects
        shapes = konvaShapes.map(shape => {
            const baseShape = {
                x: shape.x(),
                y: shape.y(),
                fill: shape.fill()
            };
            
            if (shape instanceof Konva.Rect) {
                return {
                    ...baseShape,
                    type: 'rectangle',
                    width: shape.width(),
                    height: shape.height()
                };
            } else if (shape instanceof Konva.Circle) {
                return {
                    ...baseShape,
                    type: 'circle',
                    radius: shape.radius()
                };
            } else if (shape instanceof Konva.Text) {
                return {
                    ...baseShape,
                    type: 'text',
                    text: shape.text()
                };
            }
            
            return null;
        }).filter(Boolean);
        
        // Get product groups and export their data
        placedProducts = [];
        layer.find('.Group').forEach(group => {
            if (group.attrs.productId) {
                placedProducts.push({
                    productId: group.attrs.productId,
                    name: group.findOne('Text').text(),
                    x: group.x(),
                    y: group.y()
                });
            }
        });
        
        // Create floor plan object
        const floorPlan = {
            locationId: currentLocation,
            shapes: shapes,
            placedProducts: placedProducts
        };
        
        console.log('Saving floor plan:', floorPlan);
        
        // Save to IndexedDB
        await db.put('floorPlans', floorPlan);
        
        // Verify the save by reading it back
        const savedPlan = await db.get('floorPlans', currentLocation);
        if (savedPlan) {
            console.log('Floor plan saved and verified:', savedPlan);
            alert('Floor plan saved successfully!');
        } else {
            throw new Error('Floor plan was not saved correctly');
        }
    } catch (error) {
        console.error('Error saving floor plan:', error);
        alert('Error saving floor plan: ' + error.message);
    }
}

function selectTool(tool) {
    currentTool = tool;
    
    console.log("Tool selected:", tool);
    
    // Update active button and canvas cursor
    document.querySelectorAll('.shape-button').forEach(button => {
        if (button.dataset.tool === tool) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        
        // Reset any special class
        button.classList.remove('delete-tool');
    });
    
    // Set special styling for delete tool
    if (tool === 'delete') {
        document.querySelector('[data-tool="delete"]').classList.add('delete-tool');
        stage.container().classList.add('delete-cursor');
    } else {
        stage.container().classList.remove('delete-cursor');
    }
    
    // Clear selection when changing tools (except for select tool)
    if (tool !== 'select' && transformer) {
        transformer.nodes([]);
        selectedShape = null;
        layer.draw();
    }
}

function deleteSelected() {
    if (!selectedShape) return;
    
    try {
        // First remove from transformer to prevent errors
        transformer.nodes([]);
        
        // Remove from konvaShapes array if it's a basic shape
        const index = konvaShapes.indexOf(selectedShape);
        if (index > -1) {
            konvaShapes.splice(index, 1);
        }
        
        // If it's a product group, remove from placedProducts
        if (selectedShape instanceof Konva.Group && selectedShape.attrs.productId) {
            const productId = selectedShape.attrs.productId;
            placedProducts = placedProducts.filter(p => p.productId !== productId);
        }
        
        // Remove the shape from the layer
        selectedShape.destroy();
        selectedShape = null;
        
        // Redraw the layer
        layer.draw();
        
        console.log("Shape deleted successfully");
    } catch (error) {
        console.error("Error deleting shape:", error);
        // Reset the state
        transformer.nodes([]);
        selectedShape = null;
        layer.draw();
    }
}

function clearFloorPlan() {
    if (confirm('Are you sure you want to clear the entire floor plan?')) {
        konvaShapes = [];
        layer.destroyChildren();
        layer.add(transformer);
        layer.draw();
        shapes = [];
        placedProducts = [];
    }
}

function loadProductsForPlacement() {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    
    // Get products with inventory in this location
    const productsInLocation = inventoryItems
        .filter(item => item.locationId === currentLocation && item.quantity > 0)
        .map(item => {
            const product = products.find(p => p.id === item.productId);
            return product ? {
                id: product.id,
                name: product.name,
                quantity: item.quantity
            } : null;
        })
        .filter(Boolean);
    
    productsInLocation.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <span>${product.name}</span>
            <span>(Qty: ${product.quantity})</span>
        `;
        productItem.dataset.productId = product.id;
        productItem.dataset.productName = product.name;
        
        productItem.draggable = true;
        productItem.addEventListener('dragstart', onDragStart);
        
        productList.appendChild(productItem);
    });
    
    // Make canvas container droppable
    const canvasContainer = document.querySelector('.floor-plan-canvas-container');
    canvasContainer.addEventListener('dragover', onDragOver);
    canvasContainer.addEventListener('drop', onDrop);
}

function onDragStart(e) {
    e.dataTransfer.setData('productId', e.target.dataset.productId);
    e.dataTransfer.setData('productName', e.target.dataset.productName);
}

function onDragOver(e) {
    e.preventDefault();
}

function onDrop(e) {
    e.preventDefault();
    
    const productId = e.dataTransfer.getData('productId');
    const productName = e.dataTransfer.getData('productName');
    
    if (!productId || !productName) {
        console.error("Missing product data in drop event");
        return;
    }
    
    try {
        // Get position relative to the canvas container
        const rect = stage.container().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log("Dropping product at position:", x, y);
        
        // Create product text
        const productText = new Konva.Text({
            x: 0,
            y: 0,
            text: productName,
            fontSize: 14,
            padding: 5,
            fill: '#ffffff'
        });
        
        // Create product background
        const productBox = new Konva.Rect({
            x: 0,
            y: 0,
            width: productText.width(),
            height: productText.height(),
            fill: '#2196F3',
            opacity: 0.7,
            cornerRadius: 3
        });
        
        // Group product text and box
        const productGroup = new Konva.Group({
            x: x,
            y: y,
            draggable: true,
            name: 'productGroup',
            productId: productId
        });
        
        productGroup.add(productBox);
        productGroup.add(productText);
        
        // Make sure the group is recognized as a shape for selection and dragging
        productGroup.listening(true);
        
        // Add custom drag events to prevent transformer errors
        productGroup.off('dragstart'); // Clear any existing handlers
        productGroup.off('dragend');
        
        productGroup.on('dragstart', function() {
            console.log('Product drag started');
            // Remove the transformer during drag to prevent errors
            transformer.nodes([]);
        });
        
        productGroup.on('dragend', function() {
            console.log('Product drag ended, current tool:', currentTool);
            
            // Only add the transformer back if in select mode
            if (currentTool === 'select') {
                transformer.nodes([productGroup]);
                selectedShape = productGroup;
            }
            
            // Update product position in placedProducts array
            const product = placedProducts.find(p => p.productId === productId);
            if (product) {
                product.x = productGroup.x();
                product.y = productGroup.y();
            }
            
            layer.draw();
        });
        
        // Add to layer and draw
        layer.add(productGroup);
        
        // Select the newly created product if in select mode
        if (currentTool === 'select') {
            transformer.nodes([productGroup]);
            selectedShape = productGroup;
        } else if (currentTool !== 'delete') {
            // Switch to select tool if not in delete mode
            selectTool('select');
        }
        
        layer.draw();
        
        console.log("Product placed:", productName, "at", x, y);
        
        // Add to placedProducts array
    placedProducts.push({
        productId: productId,
        name: productName,
        x: x,
        y: y
    });
    } catch (error) {
        console.error("Error placing product:", error);
    }
}

function viewFloorPlan() {
    // Toggle edit mode
    isEditMode = !isEditMode;
    
    // Update UI
    const editElements = document.querySelectorAll('.floor-plan-tools, .product-placement-panel');
    editElements.forEach(el => {
        el.style.display = isEditMode ? 'flex' : 'none';
    });
    
    document.querySelector('.floor-plan-actions').innerHTML = isEditMode
        ? `<button onclick="saveFloorPlan()">Save Floor Plan</button>
           <button onclick="viewFloorPlan()">View Mode</button>`
        : `<button onclick="viewFloorPlan()">Edit Mode</button>
           <button onclick="closeFloorPlan()">Close</button>`;
    
    try {
        // Remove transformer when switching to view mode
        if (!isEditMode) {
            transformer.nodes([]);
            selectedShape = null;
            document.body.style.cursor = 'grab';
        } else {
            document.body.style.cursor = 'default';
        }
        
        // Update Konva shapes and product groups
        konvaShapes.forEach(shape => {
            if (shape && typeof shape.draggable === 'function') {
                shape.draggable(isEditMode);
            }
        });
        
        // Update product groups
        layer.find('.Group').forEach(group => {
            if (group && typeof group.draggable === 'function') {
                group.draggable(isEditMode);
            }
        });
        
        // Toggle transformer visibility
        transformer.visible(isEditMode);
        
        layer.draw();
    } catch (error) {
        console.error("Error updating view mode:", error);
    }
}

function zoomFloorPlan(delta) {
    const oldScale = stage.scaleX();
    const newScale = oldScale + delta;
    
    // Limit zoom level between 0.1 and 3
    if (newScale >= 0.1 && newScale <= 3) {
        const center = {
            x: stage.width() / 2,
            y: stage.height() / 2
        };
        
        const mousePointTo = {
            x: (center.x - stage.x()) / oldScale,
            y: (center.y - stage.y()) / oldScale,
        };
        
        stage.scale({ x: newScale, y: newScale });
        
        const newPos = {
            x: center.x - mousePointTo.x * newScale,
            y: center.y - mousePointTo.y * newScale,
        };
        
        stage.position(newPos);
        stage.batchDraw();
        
        // Update zoom level display
        currentZoom = Math.round(newScale * 100);
        document.getElementById('zoomLevel').textContent = `${currentZoom}%`;
    }
}

function resetZoom() {
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    
    // Update zoom level display
    currentZoom = 100;
    document.getElementById('zoomLevel').textContent = `${currentZoom}%`;
}
