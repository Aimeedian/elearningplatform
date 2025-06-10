import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
 // Assuming you have a CSS file for styling
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const LearnerDashboard = () => {
    // --- State Variables ---
    const [learnerName, setLearnerName] = useState('');
    const [availableCourses, setAvailableCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [currentCourse, setCurrentCourse] = useState(null);
    const [courseProgress, setCourseProgress] = useState(0); // Progress based on notes viewed
    const [assessmentReady, setAssessmentReady] = useState(false);
    const [assessmentActive, setAssessmentActive] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Added message state for success messages

    // States for notes viewing
    const [viewingNotes, setViewingNotes] = useState(false);
    const [currentNotePage, setCurrentNotePage] = useState(1);
    const [totalNotePages, setTotalNotePages] = useState(0);
    const [noteContent, setNoteContent] = useState('');

    // NEW STATE: To track if the user is enrolled in the current selected course
    const [isEnrolled, setIsEnrolled] = useState(false);

    // NEW STATE: To store the dynamically fetched userId (e.g., from localStorage after login)
    const [currentUserId, setCurrentUserId] = useState(null);

    // Ref for the certificate component to capture for PDF
    const certificateRef = useRef();

    // Backend URL - IMPORTANT: Ensure this matches your actual backend server address
    const backendUrl = 'http://localhost:5000';

    // --- Helper Function to Clear Messages ---
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000); // Messages disappear after 5 seconds
    };

    // --- Effects ---

    // Effect to get userId from local storage and fetch available courses on component mount
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setCurrentUserId(parseInt(storedUserId, 10)); // Parse to integer
        } else {
            setError('User not logged in. Please log in to access dashboard features.');
            clearMessages();
        }
        fetchAvailableCourses();
    }, []); // Empty dependency array means this runs once on mount

    // Effect to check enrollment status when currentUserId or selectedCourseId changes
    useEffect(() => {
        const checkEnrollmentStatus = async () => {
            if (currentUserId && selectedCourseId) {
                setLoading(true);
                try {
                    const response = await axios.get(`${backendUrl}/enrollments/status?userId=${currentUserId}&moduleId=${selectedCourseId}`);
                    setIsEnrolled(response.data.isEnrolled);
                } catch (err) {
                    console.error("Failed to fetch enrollment status:", err);
                    setIsEnrolled(false); // Assume not enrolled on error
                    // setError('Failed to check enrollment status.'); // Consider if you want to show this error
                } finally {
                    setLoading(false);
                }
            } else {
                setIsEnrolled(false); // Reset if no user or course selected
            }
        };

        checkEnrollmentStatus();
    }, [currentUserId, selectedCourseId, backendUrl]); // Re-run when these change

    // Effect for Notes Progress and Assessment Readiness
    useEffect(() => {
        if (currentCourse && totalNotePages > 0 && viewingNotes) {
            const newProgress = (currentNotePage / totalNotePages) * 100;
            setCourseProgress(Math.min(newProgress, 100)); // Cap at 100%

            // If 70% of notes are viewed, make assessment ready
            if (newProgress >= 70 && !assessmentReady) {
                setAssessmentReady(true);
                setMessage(`Hello ${learnerName || 'Learner'}, you have viewed ${newProgress.toFixed(2)}% of ${currentCourse.title} notes. You can now take the assessment.`);
                clearMessages();
            }
        }
    }, [currentCourse, currentNotePage, totalNotePages, learnerName, assessmentReady, viewingNotes]);

    // Effect to fetch notes when viewingNotes, currentCourse, or currentNotePage changes
    useEffect(() => {
        if (viewingNotes && currentCourse && currentNotePage > 0) {
            fetchCourseNotesPage(currentCourse.title, currentNotePage);
        }
    }, [viewingNotes, currentCourse, currentNotePage]); // Depend on currentCourse to ensure it's loaded

    // --- API Call Functions ---

    const fetchAvailableCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/courses`);
            setAvailableCourses(response.data);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to load courses. Please check your backend server.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseNotesPage = async (courseTitle, pageNumber) => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.get(`${backendUrl}/courses/${courseTitle}/notes/${pageNumber}`);
            setNoteContent(response.data.content);
            // Assuming backend provides totalPages and pageNumber for robust navigation
            setTotalNotePages(response.data.totalPages || currentCourse.pages);
            setCurrentNotePage(response.data.pageNumber || pageNumber);
        } catch (err) {
            console.error('Error fetching notes:', err);
            const errorMessage = err.response?.data?.error || 'Failed to load course notes.';
            setError(errorMessage);
            setNoteContent('Failed to load notes for this page. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrepareAssessment = async () => {
        if (!currentCourse) {
            setError('Please select a course before taking the assessment.');
            clearMessages();
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        setViewingNotes(false); // Hide notes when starting assessment
        try {
            const courseTitleForAssessment = currentCourse.title;
            const response = await axios.get(`${backendUrl}/assessments/${courseTitleForAssessment}`);

            const fetchedQuestions = response.data.map(q => ({
                id: q.id,
                question: q.question,
                // Safely parse options if they are strings, otherwise use directly
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                answer: q.answer, // Assuming backend provides the correct answer for grading
            }));

            setQuestions(fetchedQuestions);
            setAssessmentActive(true);
            setAnswers({}); // Clear previous answers
            setResults(null); // Clear previous results
            setShowCertificate(false); // Hide certificate
        } catch (err) {
            console.error('Error fetching questions:', err);
            const errorMessage = err.response?.data?.error || 'Failed to load assessment questions. Please check your backend server and ensure questions are configured for this course.';
            setError(errorMessage);
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const sendCompletionStatus = async (passed, score) => {
        if (!currentCourse || !selectedCourseId || !currentUserId) {
            console.error("Cannot send completion status: Missing current course, selected course ID, or user ID.");
            setError("Cannot update completion: user not logged in or course not selected.");
            clearMessages();
            return;
        }

        try {
            await axios.put(`${backendUrl}/enrollments/complete`, {
                userId: currentUserId,
                moduleId: parseInt(selectedCourseId, 10),
                completionStatus: passed ? 'completed' : 'failed', // Or 'passed', 'failed'
                score: score,
                completionDate: new Date().toISOString()
            });
            console.log('Completion status sent to backend successfully!');
            setMessage('Completion status updated!');
            clearMessages();
        } catch (err) {
            console.error('Error sending completion status to backend:', err);
            setError('Failed to update completion status: ' + (err.response?.data?.message || err.response?.data?.error || 'Server error.'));
            clearMessages();
        }
    };

    // --- Event Handlers ---

    const handleNameChange = (e) => {
        setLearnerName(e.target.value);
    };

    const handleCourseSelect = (e) => {
        const selectedId = e.target.value;
        const course = availableCourses.find(c => c.id === parseInt(selectedId, 10));

        setSelectedCourseId(selectedId);
        setCurrentCourse(course || null); // Set currentCourse immediately on selection
        setCourseProgress(0);
        setAssessmentReady(false);
        setAssessmentActive(false);
        setQuestions([]);
        setAnswers({});
        setResults(null);
        setShowCertificate(false);
        setViewingNotes(false); // Reset notes view
        setCurrentNotePage(1);
        setTotalNotePages(course ? course.pages : 0); // Set total pages based on selected course
        setNoteContent('');
        setError('');
        setMessage('');
        setIsEnrolled(false); // Reset enrollment status on course change
    };

    const handleEnroll = async () => {
        if (!currentUserId) {
            setError('User ID not found. Please ensure you are logged in correctly.');
            clearMessages();
            return;
        }
        if (!learnerName.trim()) {
            setError('Please enter your name before enrolling.');
            clearMessages();
            return;
        }
        if (!selectedCourseId) {
            setError('Please select a course to enroll in.');
            clearMessages();
            return;
        }
        if (!currentCourse) {
            setError('No course selected to enroll in.');
            clearMessages();
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axios.post(`${backendUrl}/enrollments`, {
                userId: currentUserId,
                moduleId: parseInt(selectedCourseId, 10)
            });
            setMessage(response.data.message || `Successfully enrolled in ${currentCourse.title}!`);
            setIsEnrolled(true); // Set enrollment status to true
            clearMessages();
        } catch (err) {
            console.error('Enrollment error:', err);
            setError('Failed to enroll: ' + (err.response?.data?.message || err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleStartCourse = () => {
        if (!currentUserId) {
            setError('User ID not found. Please ensure you are logged in correctly.');
            clearMessages();
            return;
        }
        if (!learnerName.trim() || !selectedCourseId || !currentCourse || !isEnrolled) {
            setError('Please enter your name, select a course, and enroll before starting.');
            clearMessages();
            return;
        }
        if (currentCourse.pages === 0) {
            setError(`Course "${currentCourse.title}" has no notes configured.`);
            clearMessages();
            return;
        }

        setViewingNotes(true); // Only start viewing notes
        setCurrentNotePage(1); // Always start from the first page when starting a course
        // fetchCourseNotesPage will be called by the useEffect when viewingNotes becomes true
        setError('');
        setMessage('');
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prevAnswers => ({ ...prevAnswers, [questionId]: value }));
    };

    const handleSubmitAssessment = async () => {
        if (questions.length === 0) {
            setError('No questions to submit.');
            clearMessages();
            return;
        }

        let correctCount = 0;
        const detailedResults = {};
        const marksPerQuestion = 10; // Assuming each question is worth 10 marks

        questions.forEach(question => {
            const userAnswer = answers[question.id];
            let isCorrect = false;

            if (question.options && question.options.length > 0) {
                isCorrect = (userAnswer === question.answer);
            } else {
                // For text input questions, compare trimmed and lowercased answers
                const trimmedUserAnswer = (userAnswer || '').toString().trim().toLowerCase();
                const trimmedCorrectAnswer = (question.answer || '').toString().trim().toLowerCase();
                isCorrect = (trimmedUserAnswer === trimmedCorrectAnswer);
            }

            if (isCorrect) {
                correctCount++;
            }
            detailedResults[question.id] = {
                question: question.question,
                userAnswer: userAnswer || 'Not answered',
                correctAnswer: question.answer,
                passed: isCorrect,
            };
        });

        const totalPossibleMarks = questions.length * marksPerQuestion;
        const earnedMarks = correctCount * marksPerQuestion;
        const percentage = (earnedMarks / totalPossibleMarks) * 100;

        setResults({ percentage, detailed: detailedResults });
        setAssessmentActive(false);
        setError('');

        if (percentage >= 70) {
            setShowCertificate(true);
            setMessage('Congratulations! You passed the assessment.');
            await sendCompletionStatus(true, percentage); // Send completion status to backend
        } else {
            setShowCertificate(false);
            setMessage('You did not pass. Please review and retake.');
            await sendCompletionStatus(false, percentage); // Send failed status to backend
        }
        clearMessages();
    };

    const handleRetakeAssessment = () => {
        setAssessmentActive(true);
        setAnswers({}); // Clear answers for retake
        setResults(null); // Clear previous results
        setShowCertificate(false);
        setError('');
        setMessage('');
    };

    const handleDownloadCertificate = () => {
        if (!certificateRef.current) {
            setError('Certificate content not found for download.');
            clearMessages();
            return;
        }
        html2canvas(certificateRef.current, { scale: 2 })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = canvas.height * imgWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                pdf.save(`${learnerName || 'Learner'}_${currentCourse ? currentCourse.title.replace(/\s/g, '_') : 'Course'}_Certificate.pdf`);
                setMessage('Certificate downloaded successfully!');
                clearMessages();
            })
            .catch(err => {
                console.error("Error generating PDF:", err);
                setError("Failed to generate PDF certificate. Please try again.");
                clearMessages();
            });
    };

    const handleNextPage = () => {
        if (currentCourse && currentNotePage < currentCourse.pages) {
            setCurrentNotePage(prevPage => prevPage + 1);
            // fetchCourseNotesPage will be called by the useEffect
        } else {
            setMessage('You have reached the last page of notes.');
            clearMessages();
        }
    };

    const handlePreviousPage = () => {
        if (currentNotePage > 1) {
            setCurrentNotePage(prevPage => prevPage - 1);
            // fetchCourseNotesPage will be called by the useEffect
        } else {
            setMessage('You are on the first page of notes.');
            clearMessages();
        }
    };

    const handleToggleNotesView = () => {
        setViewingNotes(prev => !prev);
        setAssessmentActive(false); // Hide assessment if notes are toggled
        setResults(null); // Clear results if notes are toggled
        setShowCertificate(false); // Hide certificate if notes are toggled
        setError('');
        setMessage('');
        // If turning notes ON and a course is selected with pages, go to page 1
        if (!viewingNotes && currentCourse && currentCourse.pages > 0) {
            setCurrentNotePage(1);
            // fetchCourseNotesPage will be called by the useEffect
        }
    };

    // --- Render JSX ---
    return (
        <div className="dashboard-background">
            <div className="dashboard-container">
                <h1>Learner Dashboard</h1>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={learnerName}
                        onChange={handleNameChange}
                        className="name-input"
                        disabled={loading}
                    />
                </div>

                {loading && <p className="loading-message">Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}

                <div className="course-section">
                    <h2>Available Courses</h2>
                    <select
                        id="courseSelect"
                        value={selectedCourseId}
                        onChange={handleCourseSelect}
                        disabled={loading || viewingNotes || assessmentActive}
                    >
                        <option value="">Select a course</option>
                        {availableCourses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                    <br />

                    {/* Show Enroll button if not enrolled, a course is selected, name is entered, and user ID exists */}
                    {!isEnrolled && selectedCourseId && learnerName.trim() && currentUserId && (
                        <button
                            onClick={handleEnroll}
                            disabled={loading}
                            className="enroll-button"
                        >
                            Enroll in Selected Course
                        </button>
                    )}
                    {/* Message if user ID is missing (not logged in) */}
                    {!currentUserId && (
                        <p className="info-message">To enroll and start courses, please ensure you are logged in.</p>
                    )}

                    {/* Show "Start Course Notes" or "Continue Reading Notes" button only if enrolled and not currently viewing notes/assessment */}
                    {isEnrolled && currentCourse && !viewingNotes && !assessmentActive && (
                        <button
                            onClick={handleStartCourse}
                            disabled={loading || currentCourse.pages === 0}
                            className="start-course-button"
                        >
                            {courseProgress > 0 ? 'Continue Reading Notes' : 'Start Course Notes'}
                        </button>
                    )}
                    {currentCourse && currentCourse.pages === 0 && isEnrolled && (
                         <p className="info-message">This course has no notes to view.</p>
                    )}
                </div>

                {currentCourse && isEnrolled && (
                    <div className="progress-section">
                        <h2>Course: {currentCourse.title}</h2>
                        <p>Progress: **{courseProgress.toFixed(2)}%** (Notes Viewed)</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${courseProgress}%` }}></div>
                        </div>
                        {courseProgress < 100 && (
                            <p>Continue viewing notes to complete the course content.</p>
                        )}
                        {/* The "Take Assessment" button is displayed conditionally */}
                        {assessmentReady && !assessmentActive && !results && !viewingNotes && (
                            <button onClick={handlePrepareAssessment} disabled={loading} className="take-assessment-button">Take Assessment</button>
                        )}
                        {currentCourse.pages > 0 && courseProgress < 70 && !viewingNotes && (
                             <p className="info-message">View at least 70% of notes to unlock the assessment.</p>
                        )}
                    </div>
                )}

                {/* Notes Viewing Section */}
                {viewingNotes && currentCourse && (
                    <div className="notes-section">
                        <h3>Notes for {currentCourse.title}</h3>
                        {loading ? (
                            <p className="loading-message">Loading notes...</p>
                        ) : (
                            <>
                                <div className="note-content" dangerouslySetInnerHTML={{ __html: noteContent }}></div>
                                <div className="pagination-controls">
                                    <button onClick={handlePreviousPage} disabled={currentNotePage <= 1 || loading}>Previous Page</button>
                                    <span> Page **{currentNotePage}** of **{totalNotePages}** </span>
                                    <button onClick={handleNextPage} disabled={currentNotePage >= totalNotePages || loading}>Next Page</button>
                                </div>
                                <button onClick={handleToggleNotesView} className="close-notes-button">Close Notes</button>
                            </>
                        )}
                    </div>
                )}

                {/* Assessment Section */}
                {assessmentActive && currentCourse && (
                    <div className="assessment-section">
                        <h2>Assessment for {currentCourse.title}</h2>
                        {questions.length > 0 ? (
                            questions.map(question => (
                                <div key={question.id} className="question-item">
                                    <p className="question-text">**{question.question}**</p>
                                    {question.options && question.options.length > 0 ? (
                                        <div className="options-group">
                                            {question.options.map(option => (
                                                <label key={option} className="option-label">
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={option}
                                                        checked={answers[question.id] === option}
                                                        onChange={() => handleAnswerChange(question.id, option)}
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Your answer"
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            className="text-answer-input"
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No questions available for this course. Please contact support.</p>
                        )}
                        <button onClick={handleSubmitAssessment} disabled={loading} className="submit-assessment-button">Submit Assessment</button>
                    </div>
                )}

                {/* Results Section */}
                {results && (
                    <div className="results-section">
                        <h2>Assessment Results</h2>
                        <p>Your score: <strong style={{ color: results.percentage >= 70 ? 'green' : 'red' }}>{results.percentage.toFixed(2)}%</strong></p>
                        <div className="detailed-results-list">
                            {Object.values(results.detailed).map((item, index) => (
                                <div key={item.question + index} className={`result-item ${item.passed ? 'passed' : 'failed'}`}>
                                    <p><strong>Question:</strong> {item.question}</p>
                                    <p><strong>Your Answer:</strong> {item.userAnswer}</p>
                                    <p><strong>Correct Answer:</strong> {item.correctAnswer}</p>
                                    <p className={`status-text ${item.passed ? 'passed' : 'failed'}`}>Status: {item.passed ? 'Passed' : 'Failed'}</p>
                                </div>
                            ))}
                        </div>
                        {results.percentage < 70 ? (
                            <button onClick={handleRetakeAssessment} className="retake-assessment-button">Retake Assessment</button>
                        ) : (
                            <p className="success-message">Congratulations! You passed the assessment.</p>
                        )}
                    </div>
                )}

                {/* Certificate Section */}
                {showCertificate && results && results.percentage >= 70 && currentCourse && learnerName.trim() && (
                    <div className="certificate-section">
                        <div className="certificate-preview" ref={certificateRef}>
                            <h3>Certificate of Completion</h3>
                            <p>This certifies that</p>
                            <h4>**{learnerName}**</h4>
                            <p>has successfully completed:</p>
                            <p><em>**{currentCourse.title}**</em></p>
                            <p>with a score of: **{results.percentage.toFixed(2)}%**</p>
                            <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#555' }}>Date: {new Date().toLocaleDateString()}</p>
                        </div>
                        <button onClick={handleDownloadCertificate} className="download-certificate-button">Download Certificate</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearnerDashboard;