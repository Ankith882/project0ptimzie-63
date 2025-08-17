import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, ScrollArea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
interface Theme {
  id: string;
  title: string;
  type: 'light' | 'dark' | 'custom';
  backgroundImage?: string;
  preview: string;
}
interface ThemeSelectorProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onThemeChange?: (theme: Theme) => void;
}
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isDarkMode,
  onThemeToggle,
  onThemeChange
}) => {
  const [themes, setThemes] = useState<Theme[]>([{
    id: 'light',
    title: 'Light',
    type: 'light',
    preview: 'bg-white'
  }, {
    id: 'dark',
    title: 'Dark',
    type: 'dark',
    preview: 'bg-gray-900'
  }]);
  const [activeTheme, setActiveTheme] = useState<string>(isDarkMode ? 'dark' : 'light');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActionsForTheme, setShowActionsForTheme] = useState<string | null>(null);

  // Theme modal state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeTitle, setThemeTitle] = useState('');
  const [themeBackground, setThemeBackground] = useState('');

  // Long press handling
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedThemes = localStorage.getItem('app-themes');
    const savedActiveTheme = localStorage.getItem('app-active-theme');
    if (savedThemes) {
      setThemes(JSON.parse(savedThemes));
    }
    if (savedActiveTheme) {
      setActiveTheme(savedActiveTheme);
    }
  }, []);

  // Save to localStorage
  const saveToStorage = () => {
    localStorage.setItem('app-themes', JSON.stringify(themes));
    localStorage.setItem('app-active-theme', activeTheme);
  };
  useEffect(saveToStorage, [themes, activeTheme]);
  const handleThemeSelect = (themeId: string) => {
    setActiveTheme(themeId);
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      // Handle dark/light mode toggle
      if (theme.type === 'light' || theme.type === 'dark') {
        if (theme.type === 'dark' !== isDarkMode) {
          onThemeToggle();
        }
      }
      // Call onThemeChange to apply background image
      onThemeChange?.(theme);
    }
  };
  const openThemeModal = (theme?: Theme) => {
    if (theme) {
      setEditingTheme(theme);
      setThemeTitle(theme.title);
      setThemeBackground(theme.backgroundImage || '');
    } else {
      setEditingTheme(null);
      setThemeTitle('');
      setThemeBackground('');
    }
    setIsThemeModalOpen(true);
  };
  const saveTheme = () => {
    if (!themeTitle.trim()) return;
    const newTheme: Theme = {
      id: editingTheme?.id || `theme-${Date.now()}`,
      title: themeTitle,
      type: 'custom',
      backgroundImage: themeBackground,
      preview: themeBackground ? 'bg-cover bg-center' : 'bg-gradient-to-br from-purple-400 to-pink-400'
    };
    if (editingTheme) {
      setThemes(themes.map(t => t.id === editingTheme.id ? newTheme : t));
    } else {
      setThemes([...themes, newTheme]);
    }
    setIsThemeModalOpen(false);
    setThemeTitle('');
    setThemeBackground('');
    setEditingTheme(null);
  };
  const deleteTheme = (themeId: string) => {
    if (themes.find(t => t.id === themeId)?.type === 'custom') {
      setThemes(themes.filter(t => t.id !== themeId));
      if (activeTheme === themeId) {
        setActiveTheme('light');
      }
    }
    setShowActionsForTheme(null);
  };

  const handleLongPressStart = (themeId: string) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    const timer = setTimeout(() => {
      setShowActionsForTheme(themeId);
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleThemeClick = (themeId: string) => {
    // If actions are already showing for this theme, hide them (toggle behavior)
    if (showActionsForTheme === themeId) {
      setShowActionsForTheme(null);
      return;
    }
    
    // Otherwise, select the theme and hide actions for other themes
    setShowActionsForTheme(null);
    handleThemeSelect(themeId);
  };
  return <TooltipProvider>
      <div className="flex flex-col items-center space-y-4">
        {/* Theme Selector */}
        <div className="relative">
          {/* Themes Section - Positioned above the button */}
          <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="rounded-2xl bg-white/15 border border-white/20 shadow-lg backdrop-blur-lg w-12">
              <ScrollArea className="px-1 py-4 h-80 w-full">
                <div className="w-full">
                  <div className="flex flex-col items-center space-y-3">
                    {/* Add Theme Button at the top */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => openThemeModal()} variant="ghost" size="icon" className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 hover:border-white/60 transition-all duration-300 hover:scale-110">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Add Theme
                      </TooltipContent>
                    </Tooltip>

                    {/* Themes List */}
                    {themes.map(theme => <Tooltip key={theme.id}>
                        <TooltipTrigger asChild>
                           <button 
                            onClick={() => handleThemeClick(theme.id)}
                            onMouseDown={() => handleLongPressStart(theme.id)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={() => handleLongPressStart(theme.id)}
                            onTouchEnd={handleLongPressEnd}
                            className={`relative w-8 h-8 rounded-full transition-all duration-300 hover:scale-110 overflow-hidden ${activeTheme === theme.id ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white/10' : 'hover:ring-1 hover:ring-white/30'}`} 
                            style={{
                              background: !theme.backgroundImage ? (theme.id === 'light' ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)') : undefined
                            }}
                          >
                            {theme.backgroundImage && (
                              <img 
                                src={theme.backgroundImage} 
                                alt={theme.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            {theme.type === 'custom' && showActionsForTheme === theme.id && (
                              <div className="absolute -top-0.5 -right-0.5 flex space-x-0.5">
                                <button onClick={e => {
                                  e.stopPropagation();
                                  openThemeModal(theme);
                                  setShowActionsForTheme(null);
                                }} className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 shadow-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110">
                                  <Edit className="w-2.5 h-2.5 text-white" />
                                </button>
                                <button onClick={e => {
                                  e.stopPropagation();
                                  deleteTheme(theme.id);
                                }} className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 shadow-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110">
                                  <Trash2 className="w-2.5 h-2.5 text-white" />
                                </button>
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {theme.title}
                        </TooltipContent>
                      </Tooltip>)}
                   </div>
                
                  {/* Bottom border/ending */}
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="h-2 bg-gradient-to-b from-white/5 to-transparent rounded-b-xl"></div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Center - Circular Toggle Button - Always Visible and Fixed */}
          <div className="flex justify-center relative z-20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setIsExpanded(!isExpanded)} variant="ghost" size="icon" className="w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 shadow-lg bg-white/20 hover:bg-white/30">
                  <img 
                    src="/lovable-uploads/fe1804d5-d239-4bdf-9c34-e63e1e46299f.png" 
                    alt="Theme Selector" 
                    className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExpanded ? 'Hide Themes' : 'Show Theme Options'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Theme Modal */}
        <Dialog open={isThemeModalOpen} onOpenChange={setIsThemeModalOpen}>
          <DialogContent className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingTheme ? 'Edit Theme' : 'Add New Theme'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme-title">Title</Label>
                <Input id="theme-title" value={themeTitle} onChange={e => setThemeTitle(e.target.value)} placeholder="Enter theme name" className="bg-white/10 backdrop-blur-2xl border border-white/30 text-white placeholder:text-white/50 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30 shadow-lg rounded-xl transition-all duration-300 hover:bg-white/15" />
              </div>
              <div>
                <Label htmlFor="theme-background">Background Image URL</Label>
                <Input id="theme-background" value={themeBackground} onChange={e => setThemeBackground(e.target.value)} placeholder="Enter image URL" className="bg-white/10 backdrop-blur-2xl border border-white/30 text-white placeholder:text-white/50 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30 shadow-lg rounded-xl transition-all duration-300 hover:bg-white/15" />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button onClick={saveTheme} className="flex-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-2xl border border-blue-400/40 text-white hover:from-blue-500/40 hover:to-purple-500/40 hover:border-blue-400/60 shadow-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl font-semibold">
                  Save Theme
                </Button>
                <Button onClick={() => setIsThemeModalOpen(false)} variant="outline" className="flex-1 bg-white/5 backdrop-blur-2xl border border-white/30 text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white shadow-lg rounded-xl transition-all duration-300 hover:scale-105">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>;
};