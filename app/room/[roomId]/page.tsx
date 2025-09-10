@@ .. @@
    const joinRoom = () => {
        setJoining(true);
-        // The RoomCanvas component will handle the actual joining
+        // Skip the join screen and go directly to canvas
    };

+    // Auto-join if user is authenticated and room exists
+    useEffect(() => {
+        if (roomInfo && user && !joining) {
+            // Auto-join after a short delay to show room info briefly
+            const timer = setTimeout(() => {
+                setJoining(true);
+            }, 1000);
+            
+            return () => clearTimeout(timer);
+        }
+    }, [roomInfo, user, joining]);
+
    if (loading) {