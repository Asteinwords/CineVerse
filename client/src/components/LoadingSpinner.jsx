export default function LoadingSpinner({ size = 'medium', fullscreen = false }) {
    const sizeClasses = {
        small: 'w-6 h-6 border-2',
        medium: 'w-12 h-12 border-3',
        large: 'w-16 h-16 border-4'
    };

    const spinner = (
        <div className={`spinner ${sizeClasses[size]} border-t-purple-500 rounded-full animate-spin`}></div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fadeIn">
                <div className="glass-strong p-8 rounded-2xl">
                    {spinner}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            {spinner}
        </div>
    );
}
