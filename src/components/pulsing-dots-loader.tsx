
export function PulsingDotsLoader() {
    return (
        <div className="flex items-center space-x-1">
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
        </div>
    );
}
