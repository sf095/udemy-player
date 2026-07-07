import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Play, FileText, Globe, CheckCircle2, Circle, File, HelpCircle, Paperclip } from 'lucide-react';

export default function Sidebar({ sections, progress, activeLesson, onSelectLesson, onToggleComplete, onResizeStart, onResizeReset }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (secId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  // Auto-expand section containing the active lesson when it changes
  useEffect(() => {
    if (activeLesson && sections.length > 0) {
      const activeSection = sections.find((sec) =>
        sec.lessons.some((l) => l.id === activeLesson.id)
      );
      if (activeSection) {
        setExpandedSections((prev) => {
          if (prev[activeSection.id]) return prev;
          return {
            ...prev,
            [activeSection.id]: true
          };
        });
      }
    }
  }, [activeLesson, sections]);

  // Helper to count completed lessons in a section
  const getSectionStats = (lessons) => {
    const total = lessons.length;
    const completed = lessons.filter(l => progress[l.id]?.completed).length;
    return `${completed}/${total} completed`;
  };

  // Helper to count companion resources for a lesson
  const getLessonResourcesCount = (lesson) => {
    if (lesson.resources) return lesson.resources.length;
    let count = 0;
    if (lesson.pdf) count++;
    if (lesson.html) count++;
    return count;
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play size={14} style={{ color: 'var(--accent-blue)', fill: 'rgba(14, 165, 233, 0.1)' }} />;
      case 'pdf':
        return <FileText size={14} style={{ color: 'var(--primary)' }} />;
      case 'html':
        return <Globe size={14} style={{ color: 'var(--accent-amber)' }} />;
      case 'quiz':
        return <HelpCircle size={14} style={{ color: 'var(--accent-amber)' }} />;
      case 'resource':
        return <File size={14} style={{ color: 'var(--text-secondary)' }} />;
      default:
        return <FileText size={14} />;
    }
  };

  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Course Content</h3>
      </div>
      <div className="sidebar-scrollable">
        {sections.length === 0 ? (
          <div className="sidebar-empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No course folder loaded.
          </div>
        ) : (
          sections.map((sec) => {
            const isExpanded = !!expandedSections[sec.id];
            const stats = getSectionStats(sec.lessons);
            const containsActive = activeLesson && sec.lessons.some(l => l.id === activeLesson.id);

            return (
              <div key={sec.id} className={`section-accordion ${isExpanded ? 'expanded' : ''} ${containsActive ? 'has-active' : ''}`}>
                <button className="section-trigger" onClick={() => toggleSection(sec.id)}>
                  <div className="section-title-container">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sec.title}
                    </span>
                    {containsActive && !isExpanded ? (
                      <span className="section-meta playing">
                        <Play size={10} style={{ fill: 'currentColor' }} />
                        Playing: {activeLesson.title}
                      </span>
                    ) : (
                      <span className="section-meta">{stats}</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown size={16} style={{ minWidth: '16px' }} /> : <ChevronRight size={16} style={{ minWidth: '16px' }} />}
                </button>
                
                {isExpanded && (
                  <div className="section-lessons">
                    {sec.lessons.map((lesson) => {
                      const isCompleted = !!progress[lesson.id]?.completed;
                      const isActive = activeLesson?.id === lesson.id;
                      
                      // Calculate progress percent
                      const lessonProg = progress[lesson.id];
                      const progressPercent = lessonProg && lessonProg.duration > 0
                        ? (lessonProg.watchTime / lessonProg.duration) * 100
                        : 0;

                      return (
                        <div
                          key={lesson.id}
                          className={`lesson-item ${isActive ? 'active' : ''}`}
                          onClick={() => onSelectLesson(lesson)}
                        >
                          <div
                            className="checkbox-container"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent choosing lesson when checking completion
                              onToggleComplete(lesson.id, !isCompleted);
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={16} style={{ color: 'var(--accent-green)', fill: 'rgba(16,185,129,0.1)', minWidth: '16px' }} />
                            ) : (
                              <Circle size={16} style={{ color: 'var(--text-muted)', minWidth: '16px' }} />
                            )}
                          </div>
                          {getLessonIcon(lesson.type)}
                          <div className="lesson-details">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                              <span className="lesson-title-text" title={lesson.title}>
                                {lesson.title}
                              </span>
                              {getLessonResourcesCount(lesson) > 0 && (
                                <span className="lesson-resource-badge" title={`${getLessonResourcesCount(lesson)} companion resource${getLessonResourcesCount(lesson) > 1 ? 's' : ''}`}>
                                  <Paperclip size={10} />
                                  <span>{getLessonResourcesCount(lesson)}</span>
                                </span>
                              )}
                            </div>
                            {!isCompleted && progressPercent > 0 && (
                              <div className="lesson-progress-bar" style={{ width: '100%' }}>
                                <div
                                  className="lesson-progress-fill"
                                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div 
        className="resize-handle right-handle" 
        onPointerDown={onResizeStart} 
        onDoubleClick={onResizeReset} 
      />
    </div>
  );
}
