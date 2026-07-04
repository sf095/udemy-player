import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, RefreshCw, Check, X, Award, Info } from 'lucide-react';

export default function QuizViewer({ path, onComplete, isCompleted }) {
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIdx]: ['a', 'b'] }
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to map option index to a character (0 -> 'a', 1 -> 'b', etc.)
  const indexToChar = (index) => String.fromCharCode(97 + index);

  // Fetch quiz content from the API
  useEffect(() => {
    if (!path) return;
    setLoading(true);
    setError(null);
    setShowResults(false);
    setSelectedAnswers({});

    fetch(`/api/resource?path=${encodeURIComponent(path)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load quiz: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setQuizData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [path]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
        <HelpCircle size={40} className="animate-pulse" style={{ color: 'var(--primary)' }} />
        <div style={{ fontSize: '0.95rem' }}>Loading Quiz Content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '24px', color: 'var(--accent-red)', textAlign: 'center' }}>
        <AlertCircle size={40} />
        <div style={{ fontWeight: 600 }}>Error Loading Quiz</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>{error}</div>
      </div>
    );
  }

  const questions = quizData?.results || [];

  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
        <Info size={40} style={{ color: 'var(--text-muted)' }} />
        <div>No questions found in this quiz.</div>
      </div>
    );
  }

  // Handle choice selection
  const handleSelectOption = (questionIdx, charCode, isMultipleChoice) => {
    if (showResults) return; // locked once checked

    setSelectedAnswers((prev) => {
      const current = prev[questionIdx] || [];
      if (isMultipleChoice) {
        if (current.includes(charCode)) {
          return {
            ...prev,
            [questionIdx]: current.filter((c) => c !== charCode)
          };
        } else {
          return {
            ...prev,
            [questionIdx]: [...current, charCode]
          };
        }
      } else {
        // Single choice, replace selected option
        return {
          ...prev,
          [questionIdx]: [charCode]
        };
      }
    });
  };

  // Evaluate the score and correctness
  const checkAnswers = () => {
    setShowResults(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userSelected = selectedAnswers[idx] || [];
      const correctAnswers = q.correct_response || [];
      
      const isCorrect = 
        userSelected.length === correctAnswers.length &&
        userSelected.every((val) => correctAnswers.includes(val));

      if (isCorrect) {
        correctCount++;
      }
    });

    // Auto-complete if they passed all questions (or score >= 80%)
    const passThreshold = 1.0; // Require 100% correct to auto-complete
    const scoreRatio = correctCount / questions.length;
    if (scoreRatio >= passThreshold) {
      onComplete(true);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  // Safe html rendering for raw strings from the JSON payload
  const renderHtml = (htmlString) => {
    return { __html: htmlString };
  };

  // Compute stats
  let totalScore = 0;
  questions.forEach((q, idx) => {
    const userSelected = selectedAnswers[idx] || [];
    const correctAnswers = q.correct_response || [];
    const isCorrect = 
      userSelected.length === correctAnswers.length &&
      userSelected.every((val) => correctAnswers.includes(val));
    if (isCorrect) {
      totalScore++;
    }
  });

  const allAnswered = questions.every((q, idx) => (selectedAnswers[idx] || []).length > 0);
  const passRate = questions.length > 0 ? (totalScore / questions.length) : 0;
  const isPassed = passRate === 1.0;

  return (
    <div className="quiz-viewer-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-main)', overflowY: 'auto' }}>
      {/* Quiz Header */}
      <div 
        style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid var(--border-color)', 
          background: 'var(--bg-sidebar)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.1em', fontWeight: 600, color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              Interactive Quiz
            </span>
            {isCompleted && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Completed ✓
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Test Your Understanding
          </h2>
        </div>
        {showResults && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your Score</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isPassed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {totalScore} / {questions.length} ({Math.round(passRate * 100)}%)
              </div>
            </div>
            {isPassed ? (
              <Award size={36} style={{ color: 'var(--accent-green)' }} />
            ) : (
              <AlertCircle size={36} style={{ color: 'var(--accent-red)' }} />
            )}
          </div>
        )}
      </div>

      {/* Quiz Content */}
      <div style={{ flex: 1, padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {questions.map((q, qIdx) => {
            const isMultipleChoice = (q.correct_response || []).length > 1;
            const selected = selectedAnswers[qIdx] || [];
            const correctResponses = q.correct_response || [];
            
            // Check correctness for this question
            const isQuestionCorrect = 
              selected.length === correctResponses.length &&
              selected.every((val) => correctResponses.includes(val));

            return (
              <div 
                key={q.id || qIdx} 
                style={{ 
                  background: 'var(--bg-card)', 
                  border: showResults 
                    ? (isQuestionCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)')
                    : '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '24px',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                {/* Question Prompt */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-input)', 
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {qIdx + 1}
                  </span>
                  <div 
                    style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={renderHtml(q.prompt?.question || q.question_plain)} 
                  />
                </div>

                {/* Question Info Banner */}
                {isMultipleChoice && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> Note: This question has multiple correct answers. Select all that apply.
                  </div>
                )}

                {/* Answer Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(q.prompt?.answers || []).map((ansHtml, ansIdx) => {
                    const charCode = indexToChar(ansIdx);
                    const isOptionSelected = selected.includes(charCode);
                    const isOptionCorrect = correctResponses.includes(charCode);
                    
                    // Styling logic when showing results
                    let cardBg = 'var(--bg-input)';
                    let cardBorder = '1px solid var(--border-color)';
                    let iconColor = 'var(--text-muted)';
                    
                    if (showResults) {
                      if (isOptionCorrect) {
                        // Correct option
                        cardBg = 'rgba(16, 185, 129, 0.08)';
                        cardBorder = '1px solid var(--accent-green)';
                        iconColor = 'var(--accent-green)';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        // User selected an incorrect option
                        cardBg = 'rgba(239, 68, 68, 0.08)';
                        cardBorder = '1px solid var(--accent-red)';
                        iconColor = 'var(--accent-red)';
                      }
                    } else if (isOptionSelected) {
                      cardBg = 'rgba(99, 102, 241, 0.1)';
                      cardBorder = '1px solid var(--primary)';
                      iconColor = 'var(--primary)';
                    }

                    return (
                      <div key={ansIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div
                          onClick={() => handleSelectOption(qIdx, charCode, isMultipleChoice)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            borderRadius: '8px',
                            background: cardBg,
                            border: cardBorder,
                            cursor: showResults ? 'default' : 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!showResults && !isOptionSelected) {
                              e.currentTarget.style.borderColor = 'var(--border-active)';
                              e.currentTarget.style.background = 'var(--bg-hover)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!showResults && !isOptionSelected) {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.background = 'var(--bg-input)';
                            }
                          }}
                        >
                          {/* Selection indicator */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', flexShrink: 0 }}>
                            {showResults ? (
                              isOptionCorrect ? (
                                <CheckCircle2 size={18} style={{ color: 'var(--accent-green)', fill: 'rgba(16, 185, 129, 0.1)' }} />
                              ) : isOptionSelected ? (
                                <X size={18} style={{ color: 'var(--accent-red)' }} />
                              ) : (
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-color)' }} />
                              )
                            ) : (
                              isMultipleChoice ? (
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  border: isOptionSelected ? '2px solid var(--primary)' : '2px solid var(--text-muted)', 
                                  borderRadius: '4px',
                                  background: isOptionSelected ? 'var(--primary)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isOptionSelected && <Check size={12} style={{ color: 'white' }} />}
                                </div>
                              ) : (
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  border: isOptionSelected ? '2px solid var(--primary)' : '2px solid var(--text-muted)', 
                                  borderRadius: '50%',
                                  background: 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isOptionSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                </div>
                              )
                            )}
                          </div>

                          {/* Choice Text */}
                          <div 
                            style={{ fontSize: '0.9rem', color: 'var(--text-primary)', userSelect: 'none', lineHeight: 1.4 }}
                            dangerouslySetInnerHTML={renderHtml(ansHtml)} 
                          />
                        </div>

                        {/* Choice Feedback Explanation */}
                        {showResults && q.prompt?.feedbacks?.[ansIdx] && (isOptionSelected || isOptionCorrect) && (
                          <div 
                            style={{ 
                              marginLeft: '32px', 
                              padding: '10px 14px', 
                              background: 'var(--bg-main)', 
                              borderLeft: isOptionCorrect ? '3px solid var(--accent-green)' : '3px solid var(--accent-red)', 
                              borderRadius: '0 8px 8px 0',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '2px', color: isOptionCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                              {isOptionCorrect ? 'Explanation:' : 'Feedback:'}
                            </div>
                            <div dangerouslySetInnerHTML={renderHtml(q.prompt.feedbacks[ansIdx])} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px' }}>
          {!showResults ? (
            <button
              onClick={checkAnswers}
              disabled={!allAnswered}
              style={{
                background: allAnswered ? 'var(--primary)' : 'var(--bg-input)',
                color: allAnswered ? 'white' : 'var(--text-muted)',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: allAnswered ? 'pointer' : 'not-allowed',
                boxShadow: allAnswered ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (allAnswered) e.currentTarget.style.background = 'var(--primary-hover)';
              }}
              onMouseLeave={(e) => {
                if (allAnswered) e.currentTarget.style.background = 'var(--primary)';
              }}
            >
              <CheckCircle2 size={18} /> Check Answers
            </button>
          ) : (
            <>
              <button
                onClick={handleReset}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-input)';
                }}
              >
                <RefreshCw size={16} /> Try Again
              </button>

              {!isCompleted && isPassed && (
                <button
                  onClick={() => onComplete(true)}
                  style={{
                    background: 'var(--accent-green)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0d9488'; // slightly darker green
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-green)';
                  }}
                >
                  <Check size={18} /> Mark Lesson Completed
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
