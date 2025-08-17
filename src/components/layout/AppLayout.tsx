
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { LeftSidebar } from '@/components/panel/LeftSidebar';
import { ListPanel } from '@/components/panel/ListPanel';
import { DetailsPanel } from '@/components/panel/DetailsPanel';
import { MobileNavigation } from './MobileNavigation';
import { MobileHeader } from './MobileHeader';
import { MobileSlideMenu } from './MobileSlideMenu';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  isDarkMode: boolean;
  showMissions: boolean;
  showHabitTracker: boolean;
  showQuickNotes: boolean;
  updatePanelSize: (key: string, size: number) => void;
  toggleTheme: () => void;
  togglePanel: (panel: string) => void;
  // Left sidebar props
  selectedWorkspace: any;
  onMissionsClick: () => void;
  onWorkspaceManagerClick: () => void;
  onHabitTrackerClick: () => void;
  onQuickNotesClick: () => void;
  onSearchClick: () => void;
  onThemeChange: (theme: any) => void;
  // List panel props
  listPanelProps: any;
  // Details panel props
  detailsPanelProps: any;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isDarkMode,
  showMissions,
  showHabitTracker,
  showQuickNotes,
  updatePanelSize,
  toggleTheme,
  togglePanel,
  selectedWorkspace,
  onMissionsClick,
  onWorkspaceManagerClick,
  onHabitTrackerClick,
  onQuickNotesClick,
  onSearchClick,
  onThemeChange,
  listPanelProps,
  detailsPanelProps
}) => {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigationMinimized, setIsNavigationMinimized] = useState(false);
  
  const hasActivePanel = showMissions || showHabitTracker || showQuickNotes;
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        {/* Mobile Slide Menu */}
        <MobileSlideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isDarkMode={isDarkMode}
          selectedWorkspace={selectedWorkspace}
          onMissionsClick={onMissionsClick}
          showMissions={showMissions}
          onWorkspaceManagerClick={onWorkspaceManagerClick}
          onHabitTrackerClick={onHabitTrackerClick}
          showHabitTracker={showHabitTracker}
          onQuickNotesClick={onQuickNotesClick}
          showQuickNotes={showQuickNotes}
          onSearchClick={onSearchClick}
          listPanelProps={listPanelProps}
        />

        {/* Main Content Area */}
        <main className={`flex-1 overflow-hidden ${isNavigationMinimized ? '' : 'pb-20'}`}>
          {hasActivePanel && (
            <div className="h-full">
              <DetailsPanel {...detailsPanelProps} />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation
          isDarkMode={isDarkMode}
          selectedWorkspace={selectedWorkspace}
          onMissionsClick={onMissionsClick}
          showMissions={showMissions}
          onWorkspaceManagerClick={onWorkspaceManagerClick}
          onHabitTrackerClick={onHabitTrackerClick}
          showHabitTracker={showHabitTracker}
          onQuickNotesClick={onQuickNotesClick}
          showQuickNotes={showQuickNotes}
          onSearchClick={onSearchClick}
          onThemeToggle={toggleTheme}
          onThemeChange={onThemeChange}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          isMenuOpen={isMobileMenuOpen}
          onMinimizeChange={setIsNavigationMinimized}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - Desktop Only */}
        <ResizablePanel 
          defaultSize={10}
          onResize={size => updatePanelSize('leftSidebarSize', size)}
        >
          <LeftSidebar 
            isDarkMode={isDarkMode} 
            onThemeToggle={toggleTheme} 
            onThemeChange={onThemeChange} 
            selectedWorkspace={selectedWorkspace} 
            onMissionsClick={onMissionsClick} 
            showMissions={showMissions} 
            onWorkspaceManagerClick={onWorkspaceManagerClick} 
            onHabitTrackerClick={onHabitTrackerClick} 
            showHabitTracker={showHabitTracker} 
            onQuickNotesClick={onQuickNotesClick} 
            showQuickNotes={showQuickNotes}
            onSearchClick={onSearchClick}
          />
        </ResizablePanel>

        {/* List Panel */}
        {hasActivePanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={25} 
              onResize={size => updatePanelSize('detailsPanelSize', size)}
            >
              <ListPanel {...listPanelProps} />
            </ResizablePanel>

            {/* Details Panel */}
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={65}
            >
              <DetailsPanel {...detailsPanelProps} />
            </ResizablePanel>
          </>
        )}

      </ResizablePanelGroup>
    </div>
  );
};
