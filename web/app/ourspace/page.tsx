'use client';

import DashboardLayout from '../dashboard-layout';
import ChatContainer from './components/ChatContainer';

export default function OurSpacePage() {
    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-100px)] flex flex-col">
                <ChatContainer />
            </div>
        </DashboardLayout>
    );
}
