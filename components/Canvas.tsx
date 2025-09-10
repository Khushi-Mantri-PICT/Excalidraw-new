@@ .. @@
    return (
        <div className="h-screen w-screen overflow-hidden relative clean-bg-primary">
            <canvas 
                ref={canvasRef} 
                className={`absolute inset-0 ${
                    selectedTool === "pencil" ? "cursor-crosshair" : 
                    selectedTool === "eraser" ? "cursor-pointer" : "cursor-default"
                }`}
            />
            <Topbar 
                setSelectedTool={setSelectedTool} 
                selectedTool={selectedTool}
                onReset={resetCanvas}
                onClear={clearCanvas}
                onBack={() => router.push("/room")}
                onCopyUrl={copyRoomUrl}
                onDownload={downloadCanvas}
                user={user}
                roomId={roomId}
                showCopied={showCopied}
            />
        </div>
    );
}

function Topbar({
    selectedTool, 
    setSelectedTool, 
    onReset, 
    onClear,
    onBack, 
    onCopyUrl,
    onDownload,
    user, 
    roomId,
    showCopied
}: {
    selectedTool: Tool;
    setSelectedTool: (s: Tool) => void;
    onReset: () => void;
    onClear: () => void;
    onBack: () => void;
    onCopyUrl: () => void;
    onDownload: () => void;
    user: any;
    roomId: string;
    showCopied: boolean;
}) {
    return (
        <>
            {/* Main Toolbar - Responsive */}
-            <div className="fixed top-6 left-6 z-50 flex items-center gap-4">
-                <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-xl">
+            <div className="fixed top-2 sm:top-6 left-2 sm:left-6 z-50 flex items-center gap-2 sm:gap-4">
+                <div className="flex items-center gap-1 sm:gap-2 bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xl">
                    <IconButton 
                        onClick={onBack}
                        activated={false}
-                        icon={<ArrowLeft className="h-5 w-5" />}
+                        icon={<ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Back to rooms"
                    />
-                    <div className="w-px h-8 bg-slate-600" />
+                    <div className="w-px h-6 sm:h-8 bg-slate-600" />
                    <IconButton 
                        onClick={() => setSelectedTool("pencil")}
                        activated={selectedTool === "pencil"}
-                        icon={<Pencil className="h-5 w-5" />}
+                        icon={<Pencil className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Pencil Tool"
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("rect")} 
                        activated={selectedTool === "rect"} 
-                        icon={<RectangleHorizontalIcon className="h-5 w-5" />} 
+                        icon={<RectangleHorizontalIcon className="h-4 w-4 sm:h-5 sm:w-5" />} 
                        tooltip="Rectangle Tool"
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("circle")} 
                        activated={selectedTool === "circle"} 
-                        icon={<Circle className="h-5 w-5" />}
+                        icon={<Circle className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Circle Tool"
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("eraser")} 
                        activated={selectedTool === "eraser"} 
-                        icon={<Eraser className="h-5 w-5" />}
+                        icon={<Eraser className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Eraser Tool"
                    />
-                    <div className="w-px h-8 bg-slate-600" />
+                    <div className="w-px h-6 sm:h-8 bg-slate-600" />
                    <IconButton 
                        onClick={onReset}
                        activated={false} 
-                        icon={<RotateCcw className="h-5 w-5" />}
+                        icon={<RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Reset View"
                    />
                    <IconButton 
                        onClick={onClear}
                        activated={false} 
-                        icon={<Trash2 className="h-5 w-5" />}
+                        icon={<Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Clear Canvas"
                    />
                </div>
-                <ThemeToggle />
+                <div className="hidden sm:block">
+                    <ThemeToggle />
+                </div>
            </div>

            {/* User Info & Room Info - Responsive */}
-            <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
-                <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-xl">
-                    <div className="flex items-center gap-3">
-                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
-                            <Users className="h-5 w-5 text-white" />
+            <div className="fixed top-2 sm:top-6 right-2 sm:right-6 z-50 flex items-center gap-2 sm:gap-4">
+                <div className="bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-xl">
+                    <div className="flex items-center gap-2 sm:gap-3">
+                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
+                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
-                        <div className="text-sm">
-                            <p className="font-semibold text-white">{user?.name}</p>
-                            <p className="text-slate-400">Room ID: {roomId}</p>
+                        <div className="text-xs sm:text-sm">
+                            <p className="font-semibold text-white truncate max-w-20 sm:max-w-none">{user?.name}</p>
+                            <p className="text-slate-400 hidden sm:block">Room ID: {roomId}</p>
                        </div>
                    </div>
                </div>
+                <div className="block sm:hidden">
+                    <ThemeToggle />
+                </div>
            </div>

            {/* Action Buttons - Responsive */}
-            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
+            <div className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-50 flex items-center gap-2 sm:gap-3">
                <div className="relative">
                    <IconButton 
                        onClick={onCopyUrl}
                        activated={false}
-                        icon={<Copy className="h-5 w-5" />}
+                        icon={<Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                        tooltip="Copy Room URL"
                    />
                    {showCopied && (
-                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
+                        <div className="absolute -top-10 sm:-top-12 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white text-xs px-2 sm:px-3 py-1 rounded-lg backdrop-blur-sm">
                            Copied!
                        </div>
                    )}
                </div>
                <IconButton 
                    onClick={onDownload}
                    activated={false}
-                    icon={<Download className="h-5 w-5" />}
+                    icon={<Download className="h-4 w-4 sm:h-5 sm:w-5" />}
                    tooltip="Download Canvas"
                />
            </div>

            {/* Instructions - Responsive */}
-            <div className="fixed bottom-6 left-6 z-50">
-                <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-xl max-w-sm">
-                    <div className="flex items-start gap-3">
-                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
-                            <Palette className="h-4 w-4 text-white" />
+            <div className="fixed bottom-4 sm:bottom-6 left-2 sm:left-6 z-50">
+                <div className="bg-slate-800 border border-slate-600 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-xl max-w-xs sm:max-w-sm">
+                    <div className="flex items-start gap-2 sm:gap-3">
+                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
+                            <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
-                        <div className="text-sm">
-                            <p className="font-semibold text-white mb-1">Quick Tips</p>
-                            <p className="text-slate-300 text-xs leading-relaxed">
-                                • Mouse wheel to zoom • Right-click + drag to pan • Select tools above • Eraser: click shapes to delete • Copy URL to share
+                        <div className="text-xs sm:text-sm">
+                            <p className="font-semibold text-white mb-1 hidden sm:block">Quick Tips</p>
+                            <p className="text-slate-300 text-xs leading-relaxed">
+                                <span className="hidden sm:inline">• Mouse wheel to zoom • Right-click + drag to pan • Select tools above • Eraser: click shapes to delete • Copy URL to share</span>
+                                <span className="sm:hidden">• Pinch to zoom • Tap tools above • Eraser: tap shapes to delete</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}