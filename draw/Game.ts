@@ .. @@
    initZoomAndPan() {
        this.canvas.addEventListener("wheel", this.wheelHandler);
+        this.canvas.addEventListener("touchstart", this.touchStartHandler);
+        this.canvas.addEventListener("touchmove", this.touchMoveHandler);
        this.canvas.removeEventListener("touchstart", this.touchStartHandler);
        this.canvas.removeEventListener("touchmove", this.touchMoveHandler);
        this.canvas.removeEventListener("touchend", this.touchEndHandler);
+        this.canvas.addEventListener("touchend", this.touchEndHandler);
    }

+    // Touch event handlers for mobile
+    private lastTouchDistance = 0;
+    private touchStartTime = 0;
+    private touchStartPos = { x: 0, y: 0 };
+
+    touchStartHandler = (e: TouchEvent) => {
+        e.preventDefault();
+        this.touchStartTime = Date.now();
+        
+        if (e.touches.length === 1) {
+            const touch = e.touches[0];
+            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
+            
+            // Handle single touch as mouse down
+            const mouseEvent = new MouseEvent('mousedown', {
+                clientX: touch.clientX,
+                clientY: touch.clientY,
+                button: 0
+            });
+            this.mouseDownHandler(mouseEvent);
+        } else if (e.touches.length === 2) {
+            // Handle pinch to zoom
+            const touch1 = e.touches[0];
+            const touch2 = e.touches[1];
+            this.lastTouchDistance = Math.sqrt(
+                Math.pow(touch2.clientX - touch1.clientX, 2) +
+                Math.pow(touch2.clientY - touch1.clientY, 2)
+            );
+        }
+    };
+
+    touchMoveHandler = (e: TouchEvent) => {
+        e.preventDefault();
+        
+        if (e.touches.length === 1) {
+            const touch = e.touches[0];
+            
+            // Handle single touch as mouse move
+            const mouseEvent = new MouseEvent('mousemove', {
+                clientX: touch.clientX,
+                clientY: touch.clientY,
+                button: 0
+            });
+            this.mouseMoveHandler(mouseEvent);
+        } else if (e.touches.length === 2) {
+            // Handle pinch to zoom
+            const touch1 = e.touches[0];
+            const touch2 = e.touches[1];
+            const currentDistance = Math.sqrt(
+                Math.pow(touch2.clientX - touch1.clientX, 2) +
+                Math.pow(touch2.clientY - touch1.clientY, 2)
+            );
+            
+            if (this.lastTouchDistance > 0) {
+                const scale = currentDistance / this.lastTouchDistance;
+                const centerX = (touch1.clientX + touch2.clientX) / 2;
+                const centerY = (touch1.clientY + touch2.clientY) / 2;
+                
+                const newScale = Math.max(0.1, Math.min(5, this.scale * scale));
+                if (newScale !== this.scale) {
+                    this.offsetX = centerX - (centerX - this.offsetX) * (newScale / this.scale);
+                    this.offsetY = centerY - (centerY - this.offsetY) * (newScale / this.scale);
+                    this.scale = newScale;
+                    this.clearCanvas();
+                }
+            }
+            
+            this.lastTouchDistance = currentDistance;
+        }
+    };
+
+    touchEndHandler = (e: TouchEvent) => {
+        e.preventDefault();
+        
+        if (e.touches.length === 0) {
+            // Handle single touch as mouse up
+            const mouseEvent = new MouseEvent('mouseup', {
+                clientX: this.touchStartPos.x,
+                clientY: this.touchStartPos.y,
+                button: 0
+            });
+            this.mouseUpHandler(mouseEvent);
+        }
+        
+        this.lastTouchDistance = 0;
+    };

    wheelHandler = (e: WheelEvent) => {