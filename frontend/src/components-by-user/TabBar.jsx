import TabItem from "./TabItem";

function TabBar({ activeTab, onTabChange }) {
    return (
        <div className="screen-tab-bar">
            {/**
             * TODO : 하위 컴포넌트 나누기
             */}
            <TabItem isActive={activeTab === 'home'} onClick={() => onTabChange('home')} icon={{ emoji: '🏠', text: '홈' }} />
            <TabItem isActive={activeTab === 'search'} onClick={() => onTabChange('search')} icon={{ emoji: '✚', text: '새루틴' }} />
            <TabItem isActive={activeTab === 'profile'} onClick={() => onTabChange('profile')} icon={{ emoji: '▶', text: '재생' }} />
            <TabItem isActive={activeTab === 'settings'} onClick={() => onTabChange('settings')} icon={{ emoji: '📁', text: '보관함' }} />
            <TabItem isActive={activeTab === 'notifications'} onClick={() => onTabChange('notifications')} icon={{ emoji: '👤', text: '내정보' }} />
            {/* <button
                className={activeTab === 'home' ? 'active' : ''}
                onClick={() => onTabChange('home')}
            >
                Home
            </button>
            <button
                className={activeTab === 'search' ? 'active' : ''}
                onClick={() => onTabChange('search')}
            >
                Search
            </button>
            <button
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => onTabChange('profile')}
            >
                Profile
            </button> */}
        </div>
    );
}

export default TabBar;