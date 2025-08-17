import React, { useState } from 'react';
import { FileUploadManager } from '@/components/task/FileUploadManager';
import { LinkAddManager } from '@/components/task/LinkAddManager';
import { QuillEditorCore } from './quill/QuillEditorCore';
import { QuillEditorToolbar } from './quill/QuillEditorToolbar';
import { AttachmentsList } from './quill/AttachmentsList';
import { CommentSection } from './quill/CommentSection';
import { 
  useQuillEditor, 
  useColorPicker, 
  useModals, 
  useAttachmentEditor,
  type Attachment,
  type Comment
} from './quill/QuillEditorHooks';

interface QuillEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  isDarkMode: boolean;
  initialAttachments?: Attachment[];
  initialComments?: Comment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  onCommentsChange?: (comments: Comment[]) => void;
}

declare global {
  interface Window {
    Quill: any;
  }
}

export const QuillEditor: React.FC<QuillEditorProps> = ({
  initialContent,
  onChange,
  isDarkMode,
  initialAttachments = [],
  initialComments = [],
  onAttachmentsChange,
  onCommentsChange
}) => {
  // Hooks for managing editor state
  const {
    editorRef,
    toolbarRef,
    quillRef,
    attachments,
    setAttachments,
    comments,
    setComments,
    hasTextSelection,
    setHasTextSelection,
    savedSelection,
    setSavedSelection,
    saveSelection,
    applyFormat
  } = useQuillEditor(initialContent, onChange, initialAttachments, initialComments, onAttachmentsChange, onCommentsChange);

  const {
    showColorPicker,
    setShowColorPicker,
    selectedColor,
    setSelectedColor,
    showBackgroundColorPicker,
    setShowBackgroundColorPicker,
    selectedBackgroundColor,
    setSelectedBackgroundColor
  } = useColorPicker();

  const {
    showFileUploadManager,
    setShowFileUploadManager,
    showLinkAddManager,
    setShowLinkAddManager,
    wasTextSelectedForLink,
    setWasTextSelectedForLink,
    wasTextSelectedForFile,
    setWasTextSelectedForFile,
    showCommentInput,
    setShowCommentInput
  } = useModals();

  const {
    editingAttachment,
    setEditingAttachment,
    editAttachmentData,
    setEditAttachmentData,
    showColorPickerFor,
    setShowColorPickerFor
  } = useAttachmentEditor();

  const [newCommentText, setNewCommentText] = useState('');

  const handleFileUpload = (file: File, displayText?: string) => {
    const text = displayText || file.name;
    const attachmentId = Date.now().toString();
    
    if (quillRef.current && savedSelection && savedSelection.length > 0) {
      // Apply to selected text - create blob URL and format as link
      const blobUrl = URL.createObjectURL(file);
      
      // Store file reference for preservation
      const fileAttachment = {
        id: attachmentId,
        url: blobUrl,
        text: text,
        type: 'file' as const,
        color: '#8B5CF6',
        fileData: file // Store the actual file for recovery
      };
      
      // Add to attachments for preservation
      setAttachments(prev => [...prev, fileAttachment]);
      
      // Restore selection and apply formatting
      quillRef.current.setSelection(savedSelection);
      
      // Apply the link formatting with a data attribute to track the attachment
      quillRef.current.format('link', blobUrl);
      quillRef.current.format('color', '#3B82F6');
      quillRef.current.format('underline', true);
      
      // Enhanced URL preservation and recovery mechanism
      setTimeout(() => {
        const links = quillRef.current.root.querySelectorAll('a');
        const lastLink = links[links.length - 1];
        if (lastLink) {
          // Set multiple data attributes for recovery
          lastLink.setAttribute('data-original-blob', blobUrl);
          lastLink.setAttribute('data-attachment-id', attachmentId);
          lastLink.setAttribute('data-file-name', file.name);
          lastLink.setAttribute('data-file-type', file.type);
          
          // Force set the correct href
          lastLink.setAttribute('href', blobUrl);
          
          // Add enhanced click handler that handles blob URL recovery
          lastLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            let urlToOpen = lastLink.getAttribute('href');
            
            // If URL is corrupted, try to recover from attachment
            if (!urlToOpen || urlToOpen === 'about:blank') {
              const attachmentId = lastLink.getAttribute('data-attachment-id');
              if (attachmentId) {
                const attachment = attachments.find(a => a.id === attachmentId);
                if (attachment && attachment.url && attachment.url.startsWith('blob:')) {
                  urlToOpen = attachment.url;
                } else {
                  // Last resort: recreate blob URL from stored file data
                  const fileData = (attachment as any)?.fileData;
                  if (fileData instanceof File) {
                    urlToOpen = URL.createObjectURL(fileData);
                    // Update the attachment with new blob URL
                    setAttachments(prev => prev.map(a => 
                      a.id === attachmentId ? { ...a, url: urlToOpen } : a
                    ));
                  }
                }
              }
            }
            
            if (urlToOpen && urlToOpen !== 'about:blank') {
              window.open(urlToOpen, '_blank', 'noopener,noreferrer');
            }
          });
        }
      }, 100);
      
      // Keep the selection after formatting
      quillRef.current.setSelection(savedSelection);
    } else {
      // No text selected - add to footer
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        id: attachmentId,
        url: url,
        text: text,
        type: 'file',
        color: '#8B5CF6',
        fileData: file // Store file data for recovery
      }]);
    }
    
    setShowFileUploadManager(false);
    setSavedSelection(null); // Clear saved selection after use
  };

  const handleAddLink = (url: string, displayText?: string) => {
    const text = displayText || url;
    let href = url;
    // Ensure protocol is included
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      href = 'https://' + href;
    }
    
    const attachmentId = Date.now().toString();
    
    if (quillRef.current && savedSelection && savedSelection.length > 0) {
      // Apply to selected text - restore selection and format
      quillRef.current.setSelection(savedSelection);
      quillRef.current.format('link', href);
      quillRef.current.format('color', '#3B82F6');
      quillRef.current.format('underline', true);
      
      // Keep the selection after formatting
      quillRef.current.setSelection(savedSelection);
      
      const formattedText = quillRef.current.getText(savedSelection.index, savedSelection.length);
    } else {
      // No text selected - add to footer
      setAttachments(prev => [...prev, {
        id: attachmentId,
        url: href,
        text: text,
        type: 'link',
        color: '#3B82F6'
      }]);
    }
    
    setShowLinkAddManager(false);
    setSavedSelection(null); // Clear saved selection after use
  };

  // Footer attachment handlers
  const handleEditAttachment = (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment) {
      setEditingAttachment(id);
      setEditAttachmentData({ url: attachment.url, text: attachment.text });
    }
  };

  const handleSaveAttachment = () => {
    if (editingAttachment) {
      setAttachments(prev => prev.map(attachment => 
        attachment.id === editingAttachment 
          ? { ...attachment, url: editAttachmentData.url, text: editAttachmentData.text }
          : attachment
      ));
      setEditingAttachment(null);
      setEditAttachmentData({ url: '', text: '' });
    }
  };

  const handleDeleteAttachment = (id: string) => {
    const newAttachments = attachments.filter(attachment => attachment.id !== id);
    setAttachments(newAttachments);
    // Immediately trigger the parent callback with updated attachments
    onAttachmentsChange?.(newAttachments);
  };

  const handleChangeAttachmentColor = (id: string, color: string) => {
    setAttachments(prev => prev.map(attachment => 
      attachment.id === id ? { ...attachment, color } : attachment
    ));
    setShowColorPickerFor(null);
  };

  const handleOpenAttachment = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    if (attachment.type === 'file') {
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.text; // Use the display text as filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Comment handlers
  const handleAddComment = (taskId: string, text: string, color: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      color,
      createdAt: new Date(),
      taskId
    };
    setComments(prev => [...prev, newComment]);
  };

  const handleSubmitNewComment = () => {
    if (newCommentText.trim()) {
      handleAddComment("quill-editor", newCommentText, '#3B82F6');
      setNewCommentText('');
      setShowCommentInput(false);
    }
  };

  const handleCancelComment = () => {
    setShowCommentInput(false);
    setNewCommentText('');
  };

  const handleEditComment = (commentId: string, text: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId ? { ...comment, text } : comment
    ));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleChangeCommentColor = (commentId: string, color: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId ? { ...comment, color } : comment
    ));
  };

  const presetColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'
  ];

  return (
    <div className="h-full flex flex-col">
      <QuillEditorToolbar
          toolbarRef={toolbarRef}
          isDarkMode={isDarkMode}
          saveSelection={saveSelection}
          applyFormat={applyFormat}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          showBackgroundColorPicker={showBackgroundColorPicker}
          setShowBackgroundColorPicker={setShowBackgroundColorPicker}
          selectedBackgroundColor={selectedBackgroundColor}
          setSelectedBackgroundColor={setSelectedBackgroundColor}
          hasTextSelection={hasTextSelection}
          setWasTextSelectedForFile={setWasTextSelectedForFile}
          setShowFileUploadManager={setShowFileUploadManager}
          setShowCommentInput={setShowCommentInput}
          showCommentInput={showCommentInput}
        />

      <div className="flex-1 flex flex-col min-h-0">
        <QuillEditorCore
          editorRef={editorRef}
          toolbarRef={toolbarRef}
          quillRef={quillRef}
          initialContent={initialContent}
          onChange={onChange}
          isDarkMode={isDarkMode}
          setHasTextSelection={setHasTextSelection}
          setSavedSelection={setSavedSelection}
          setWasTextSelectedForLink={setWasTextSelectedForLink}
          setShowLinkAddManager={setShowLinkAddManager}
          footerContent={
            <>
              {(attachments.length > 0 || comments.length > 0 || showCommentInput) && (
                <>
                  <AttachmentsList
                    attachments={attachments}
                    editingAttachment={editingAttachment}
                    setEditingAttachment={setEditingAttachment}
                    editAttachmentData={editAttachmentData}
                    setEditAttachmentData={setEditAttachmentData}
                    showColorPickerFor={showColorPickerFor}
                    setShowColorPickerFor={setShowColorPickerFor}
                    onSaveAttachment={handleSaveAttachment}
                    onDeleteAttachment={handleDeleteAttachment}
                    onChangeAttachmentColor={handleChangeAttachmentColor}
                    onOpenAttachment={handleOpenAttachment}
                    onDownloadAttachment={handleDownloadAttachment}
                  />

                  <CommentSection
                    comments={comments}
                    showCommentInput={showCommentInput}
                    newCommentText={newCommentText}
                    setNewCommentText={setNewCommentText}
                    onSubmitNewComment={handleSubmitNewComment}
                    onCancelComment={handleCancelComment}
                    isDarkMode={isDarkMode}
                    onAddComment={handleAddComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onChangeCommentColor={handleChangeCommentColor}
                    hasOtherContent={attachments.length > 0 || showCommentInput}
                  />
                </>
              )}
            </>
          }
        />
      </div>

      <FileUploadManager
        isDarkMode={isDarkMode}
        isVisible={showFileUploadManager}
        onFileUpload={handleFileUpload}
        onClose={() => setShowFileUploadManager(false)}
        hasTextSelection={wasTextSelectedForFile}
      />

      <LinkAddManager
        isDarkMode={isDarkMode}
        isVisible={showLinkAddManager}
        onAddLink={handleAddLink}
        onClose={() => setShowLinkAddManager(false)}
        selectedText={wasTextSelectedForLink ? "Selected text" : undefined}
        hasTextSelection={wasTextSelectedForLink}
      />
    </div>
  );
};