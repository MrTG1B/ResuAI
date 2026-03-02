import { MentraIcon } from './mentra-icon';

export const AssistantAvatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const sizeClasses = size === 'md' ? 'h-12 w-12' : 'h-8 w-8';
    const iconClasses = size === 'md' ? 'h-7 w-7' : 'h-5 w-5';
    return (
        <div className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 bg-[#3aa195] shadow-lg shadow-[#3aa195]/20`}>
            <MentraIcon className={`${iconClasses} text-white`} />
        </div>
    );
};
