@@ .. @@
export function IconButton({
    icon, onClick, activated, tooltip
}: {
    icon: ReactNode;
    onClick: () => void;
    activated: boolean;
    tooltip?: string;
}) {
    return (
        <div 
            className={`cursor-pointer rounded-lg p-2 sm:p-3 transition-all duration-200 ${
                activated 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600"
            }`}
            onClick={onClick}
            title={tooltip}
        >
-            @ts-ignore
            {icon}
        </div>
    );
}