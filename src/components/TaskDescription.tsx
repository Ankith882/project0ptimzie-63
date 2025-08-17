import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, ScrollArea } from '@/components/ui';
import { Flag, ExternalLink, FileIcon, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types/task';
import { QuillEditor } from './QuillEditor';

interface TaskDescriptionProps {
  selectedTask: Task | null;
  isDarkMode: boolean;
  onHeaderClick: () => void;
  onDescriptionUpdate: (description: string, attachments?: Array<{url: string, text: string, type: 'link' | 'file' | 'image', color: string}>, comments?: Array<{id: string, text: string, color: string, createdAt: Date, taskId: string}>) => void;
  onSettingsClick: () => void;
  onWorkspaceClick: () => void;
  onSignOut: () => void;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({
  selectedTask,
  isDarkMode,
  onHeaderClick,
  onDescriptionUpdate,
  onSettingsClick,
  onWorkspaceClick,
  onSignOut
}) => {
  const [description, setDescription] = useState('');
  const [showQuillEditor, setShowQuillEditor] = useState(false);
  const [clickCounter, setClickCounter] = useState(0);
  const [taskLinks, setTaskLinks] = useState<Array<{url: string, text: string, type: 'link' | 'file' | 'image', color: string}>>([]);
  const [taskComments, setTaskComments] = useState<Array<{id: string, text: string, color: string, createdAt: Date, taskId: string}>>([]);
  const [originalData, setOriginalData] = useState({ description: '', links: [] as any[], comments: [] as any[] });

  const priorities = {
    'P1': { label: 'Critical', color: '#EF4444', emoji: '🔴' },
    'P2': { label: 'High', color: '#F97316', emoji: '🟠' },
    'P3': { label: 'Important', color: '#F59E0B', emoji: '🟡' },
    'P4': { label: 'Moderate', color: '#22C55E', emoji: '🟢' },
    'P5': { label: 'Low', color: '#0EA5E9', emoji: '🔵' },
    'P6': { label: 'Deferred', color: '#8B5CF6', emoji: '🟣' },
    'P7': { label: 'None', color: '#9CA3AF', emoji: '⚪' },
  };

  useEffect(() => {
    const newDescription = selectedTask?.description || '';
    setDescription(newDescription);
    
    const links = selectedTask?.attachments?.map(att => ({
      url: att.url,
      text: att.text,
      type: att.type,
      color: att.color
    })) || [];
    setTaskLinks(links);
    
    const comments = selectedTask?.comments || [];
    setTaskComments(comments);
  }, [selectedTask]);

  const handleDescriptionClick = () => {
    setClickCounter(prev => {
      const newCount = prev + 1;
      
      setTimeout(() => {
        setClickCounter(0);
      }, 400);
      
      if (newCount >= 3) {
        setOriginalData({ description, links: [...taskLinks], comments: [...taskComments] });
        setShowQuillEditor(true);
        return 0;
      }
      
      return newCount;
    });
  };

  const handleQuillSave = (content: string) => {
    setDescription(content);
    onDescriptionUpdate(content, taskLinks, taskComments);
    setShowQuillEditor(false);
  };

  const handleQuillCancel = () => {
    // Revert to original data without saving
    setDescription(originalData.description);
    setTaskLinks([...originalData.links]);
    setTaskComments([...originalData.comments]);
    // Update the task with original data to truly cancel changes
    onDescriptionUpdate(originalData.description, originalData.links, originalData.comments);
    setShowQuillEditor(false);
  };

  const openLink = (url: string) => {
    if (url.startsWith('blob:')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const finalUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getPriorityInfo = (priority: string) => 
    priorities[priority as keyof typeof priorities] || priorities.P3;

  return (
    <div className="h-full flex flex-col backdrop-blur-xl bg-white/10 border-l border-white/20 rounded-l-3xl mx-2 my-2">
      <div 
        className="sticky top-0 z-10 p-2 sm:p-3 border-b border-white/20 cursor-pointer hover:bg-white/5 transition-colors bg-white/10 backdrop-blur-xl"
        onClick={onHeaderClick}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-lg sm:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} truncate flex-1`}>
            Description
          </h2>
          
          {selectedTask?.priority && (
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Flag className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: getPriorityInfo(selectedTask.priority).color }} />
              <span className={`${isDarkMode ? 'text-white/80' : 'text-gray-600'} hidden sm:inline`}>
                {getPriorityInfo(selectedTask.priority).emoji} {getPriorityInfo(selectedTask.priority).label}
              </span>
              <span className={`${isDarkMode ? 'text-white/80' : 'text-gray-600'} sm:hidden`}>
                {getPriorityInfo(selectedTask.priority).emoji}
              </span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-full">
          {selectedTask ? (
            <div className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6">
              <Card className="bg-white/5 backdrop-blur-md border border-white/20">
                <CardContent className="p-3 sm:p-4 ql-read-mode">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} break-words flex-1`}>
                      {selectedTask.title}
                    </h3>
                    
                    {showQuillEditor && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          onClick={() => handleQuillSave(description)}
                          className="h-6 px-3 py-1 text-xs font-medium rounded-full bg-primary/80 hover:bg-primary text-primary-foreground border-0"
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleQuillCancel}
                          className="h-6 px-3 py-1 text-xs font-medium rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    
                    <button 
                      onClick={onHeaderClick}
                      className={`text-xs ${isDarkMode ? 'text-white hover:text-white/80' : 'text-gray-800 hover:text-gray-600'} cursor-pointer transition-colors ml-2`}
                    >
                      👋 Welcome
                    </button>
                  </div>

                  {showQuillEditor ? (
                    <div className="h-[calc(100vh-12rem)]">
                      <QuillEditor
                        initialContent={description}
                        onChange={setDescription}
                        isDarkMode={isDarkMode}
                        initialAttachments={taskLinks
                          .filter(link => link.type !== 'image')
                          .map(link => ({
                            id: Date.now().toString() + Math.random(),
                            url: link.url,
                            text: link.text,
                            type: link.type as 'link' | 'file',
                            color: link.color
                          }))}
                        initialComments={taskComments}
                        onAttachmentsChange={(attachments) => {
                          const updatedLinks = attachments.map(att => ({
                            url: att.url,
                            text: att.text,
                            type: att.type,
                            color: att.color
                          }));
                          setTaskLinks(updatedLinks);
                          // Only update local state, don't auto-save attachments
                          // Save will happen when user clicks Save button
                        }}
                        onCommentsChange={setTaskComments}
                      />
                    </div>
                  ) : (
                    <div 
                      className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap mb-4 cursor-pointer min-h-[80px] sm:min-h-[100px] p-2 rounded text-sm sm:text-base break-words`}
                      onClick={handleDescriptionClick}
                      dangerouslySetInnerHTML={{ 
                        __html: description || 'No description provided. Triple-click to edit.' 
                      }}
                    />
                  )}

                  {/* Attachments */}
                  {taskLinks.length > 0 && !showQuillEditor && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="space-y-2">
                        {taskLinks.map((link, index) => (
                          <div key={index} className="p-2 sm:p-3 bg-white/5 rounded border border-white/10">
                            <div className="flex items-center gap-2">
                              {link.type === 'file' ? (
                                <FileIcon className="h-4 w-4 flex-shrink-0" style={{ color: link.color }} />
                              ) : (
                                <ExternalLink className="h-4 w-4 flex-shrink-0" style={{ color: link.color }} />
                              )}
                              <button
                                onClick={() => openLink(link.url)}
                                className="text-sm hover:underline truncate text-left"
                                style={{ color: link.color }}
                              >
                                {link.text}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {taskComments.length > 0 && !showQuillEditor && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                        Comments ({taskComments.length})
                      </h4>
                      <div className="space-y-3">
                        {taskComments.map((comment) => (
                          <div key={comment.id} className="p-3 bg-white/5 rounded border border-white/10">
                            <div className="flex items-start gap-2">
                              <MessageCircle 
                                className="h-4 w-4 mt-0.5 flex-shrink-0"
                                style={{ color: comment.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-words`}>
                                  {comment.text}
                                </p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No task selected.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskDescription;