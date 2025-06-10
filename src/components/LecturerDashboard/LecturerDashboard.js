import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LecturerDashboard.css'; // Import the updated CSS file

const LecturerDashboard = () => {
    // State to manage which section is currently active for display
    const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'my-courses', 'course-editor', 'file-upload', 'assessment-builder', 'learner-progress'

    // State to store the list of courses fetched from the backend
    const [courses, setCourses] = useState([]);
    // State for the form to add a new course
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        credits: '',
        lecturer_id: '',
        pages: ''
    });
    // State to track the ID of the course being edited
    const [editingCourseId, setEditingCourseId] = useState(null);
    // State to hold the data of the course being edited
    const [editingCourse, setEditingCourse] = useState({ ...newCourse });
    // State for displaying success messages to the user
    const [message, setMessage] = useState('');
    // State for displaying error messages to the user
    const [error, setError] = useState('');
    // State to indicate if data is currently being loaded (for courses)
    const [loading, setLoading] = useState(false);

    // State for file upload functionality
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');

    // --- NEW STATE FOR ASSESSMENT BUILDER ---
    const [assessments, setAssessments] = useState([]);
    const [newAssessment, setNewAssessment] = useState({
        assessment_title: '', // Changed from 'title' to match backend schema
        assessment_type: 'Quiz', // Default to Quiz
        associated_course_id: '', // To link assessment to a course
        duration_minutes: '', // in minutes
        passing_score_percent: '', // percentage
    });
    const [editingAssessmentId, setEditingAssessmentId] = useState(null);
    const [editingAssessment, setEditingAssessment] = useState({});
    const [assessmentLoading, setAssessmentLoading] = useState(false);
    const [assessmentMessage, setAssessmentMessage] = useState('');
    const [assessmentError, setAssessmentError] = useState('');

    // --- NEW STATE FOR LEARNER PROGRESS (Conceptual) ---
    const [learnerScores, setLearnerScores] = useState([]); // { learner_id, name, course_id, course_title, score }
    const [learnerProgressLoading, setLearnerProgressLoading] = useState(false);
    const [learnerProgressError, setLearnerProgressError] = useState('');


    // Base URL of your backend API
    const backendUrl = 'http://localhost:5000'; // Make sure this matches your Flask backend URL

    // Helper to clear general messages after a delay
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000); // Clear messages after 5 seconds
    };

    // Helper to clear upload messages after a delay
    const clearUploadMessages = () => {
        setTimeout(() => {
            setUploadMessage('');
            setUploadError('');
        }, 5000); // Clear messages after 5 seconds
    };

    // Helper to clear assessment messages after a delay
    const clearAssessmentMessages = () => {
        setTimeout(() => {
            setAssessmentMessage('');
            setAssessmentError('');
        }, 5000); // Clear messages after 5 seconds
    };

    // useEffect hook to fetch courses when the component mounts or when 'My Courses' is active
    useEffect(() => {
        if (activeSection === 'my-courses' || activeSection === 'assessment-builder' || activeSection === 'course-editor') {
            fetchCourses(); // Fetch courses for display in 'My Courses' and for the dropdown in 'Assessment Builder' and 'Course Editor'
        }
        if (activeSection === 'assessment-builder') {
            fetchAssessments();
        }
        if (activeSection === 'learner-progress') {
            fetchLearnerProgress();
        }
    }, [activeSection]); // Re-fetch data when the activeSection changes

    // Function to fetch the list of courses from the backend
    const fetchCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/courses`);
            setCourses(response.data);
            setMessage('Courses loaded successfully!');
            clearMessages();
        } catch (err) {
            console.error('Fetch courses error:', err);
            setError('Failed to fetch courses. Please check your network and backend server.');
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch the list of assessments from the backend
    const fetchAssessments = async () => {
        setAssessmentLoading(true);
        setAssessmentError('');
        try {
            const response = await axios.get(`${backendUrl}/assessments`);
            // Ensure course_id is an integer for dropdown consistency
            setAssessments(response.data.map(assessment => ({
                ...assessment,
                associated_course_id: String(assessment.associated_course_id) // Convert to string for <select> value
            })));
            setAssessmentMessage('Assessments loaded successfully!');
            clearAssessmentMessages();
        } catch (err) {
            console.error('Fetch assessments error:', err);
            setAssessmentError('Failed to fetch assessments. Please check your network and backend server.');
            clearAssessmentMessages();
        } finally {
            setAssessmentLoading(false);
        }
    };

    // Function to fetch learner progress (conceptual)
    const fetchLearnerProgress = async () => {
        setLearnerProgressLoading(true);
        setLearnerProgressError('');
        try {
            const response = await axios.get(`${backendUrl}/learner_scores`);
            setLearnerScores(response.data);
            setLearnerProgressError(''); // Clear any previous error
            setMessage('Learner progress loaded successfully!'); // Using general message for now
            clearMessages();
        } catch (err) {
            console.error('Fetch learner progress error:', err);
            setLearnerProgressError('Failed to fetch learner progress.');
            setError('Failed to fetch learner progress.'); // Use general error for now
            clearMessages();
        } finally {
            setLearnerProgressLoading(false);
        }
    };


    // Generic handler for input changes in forms
    const handleInputChange = (e, setter) => {
        const { name, value } = e.target;
        setter(prev => ({ ...prev, [name]: value }));
    };

    // Handler for adding a new course
    const handleAddCourse = async (e) => {
        e.preventDefault();
        clearMessages(); // Clear existing general messages

        // Basic client-side validation for required fields
        if (!newCourse.title || !newCourse.credits || !newCourse.lecturer_id || !newCourse.pages) {
            setError('Please fill in all required fields (Title, Credits, Lecturer ID, Pages).');
            clearMessages();
            return;
        }

        setLoading(true); // Set loading for the operation
        setError('');
        try {
            await axios.post(`${backendUrl}/courses`, newCourse);
            setMessage('Course added successfully!');
            setNewCourse({ title: '', description: '', credits: '', lecturer_id: '', pages: '' }); // Reset the form
            fetchCourses(); // Refresh the course list
            clearMessages();
        } catch (err) {
            console.error('Add course error:', err);
            setError('Failed to add course: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // Handler to set a course for editing
    const handleEditCourse = (course) => {
        setEditingCourseId(course.id);
        setEditingCourse({ ...course }); // Populate the edit form with course data
        clearMessages();
    };

    // Handler for updating an existing course
    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        clearMessages(); // Clear existing general messages

        // Basic client-side validation for required fields
        if (!editingCourse.title || !editingCourse.credits || !editingCourse.lecturer_id || !editingCourse.pages) {
            setError('Please fill in all required fields for editing (Title, Credits, Lecturer ID, Pages).');
            clearMessages();
            return;
        }

        setLoading(true); // Set loading for the operation
        setError('');
        try {
            await axios.put(`${backendUrl}/courses/${editingCourseId}`, editingCourse);
            setMessage('Course updated successfully!');
            setEditingCourseId(null); // Clear the editing state
            setEditingCourse({}); // Clear editing course data
            fetchCourses(); // Refresh the course list
            clearMessages();
        } catch (err) {
            console.error('Update course error:', err);
            setError('Failed to update course: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // Handler for deleting a course
    const handleDeleteCourse = async (id) => {
        if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            setLoading(true); // Set loading for the operation
            setError('');
            try {
                await axios.delete(`${backendUrl}/courses/${id}`);
                setMessage('Course deleted successfully!');
                fetchCourses(); // Refresh the course list
                clearMessages();
            } catch (err) {
                console.error('Delete course error:', err);
                setError('Failed to delete course: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    // Handler for selecting files for upload
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files); // e.target.files is a FileList
        setUploadError('');
        setUploadMessage('');
    };

    // Handler for uploading files
    const handleFileUpload = async () => {
        if (!selectedFile || selectedFile.length === 0) {
            setUploadError('Please select files to upload.');
            clearUploadMessages();
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadMessage('');

        const formData = new FormData();
        for (let i = 0; i < selectedFile.length; i++) {
            formData.append('files', selectedFile[i]); // 'files' should match your backend field name
        }

        try {
            const response = await axios.post(`${backendUrl}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload successful:', response.data);
            setUploadMessage('File(s) uploaded successfully!');
            setSelectedFile(null); // Clear selected files after upload
            clearUploadMessages();
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError('Failed to upload file(s): ' + (err.response?.data?.error || 'Server error.'));
            clearUploadMessages();
        } finally {
            setUploading(false);
        }
    };

    // --- NEW ASSESSMENT HANDLERS ---
    const handleAddAssessment = async (e) => {
        e.preventDefault();
        clearAssessmentMessages();

        // Validate inputs
        if (!newAssessment.assessment_title || !newAssessment.assessment_type || !newAssessment.associated_course_id || !newAssessment.duration_minutes || !newAssessment.passing_score_percent) {
            setAssessmentError('Please fill in all assessment fields.');
            clearAssessmentMessages();
            return;
        }

        setAssessmentLoading(true);
        try {
            // Send numerical values as numbers, not strings
            await axios.post(`${backendUrl}/assessments`, {
                ...newAssessment,
                duration_minutes: parseInt(newAssessment.duration_minutes),
                passing_score_percent: parseFloat(newAssessment.passing_score_percent), // Use parseFloat for DECIMAL
                associated_course_id: parseInt(newAssessment.associated_course_id)
            });
            setAssessmentMessage('Assessment added successfully!');
            setNewAssessment({
                assessment_title: '',
                assessment_type: 'Quiz',
                associated_course_id: '',
                duration_minutes: '',
                passing_score_percent: '',
            }); // Reset form
            fetchAssessments(); // Refresh list
            clearAssessmentMessages();
        } catch (err) {
            console.error('Add assessment error:', err);
            setAssessmentError('Failed to add assessment: ' + (err.response?.data?.error || 'Server error.'));
            clearAssessmentMessages();
        } finally {
            setAssessmentLoading(false);
        }
    };

    const handleEditAssessment = (assessment) => {
        setEditingAssessmentId(assessment.assessment_id); // Use assessment_id
        setEditingAssessment({
            ...assessment,
            // Convert numerical values to strings for input fields
            associated_course_id: String(assessment.associated_course_id),
            duration_minutes: String(assessment.duration_minutes),
            passing_score_percent: String(assessment.passing_score_percent)
        });
        clearAssessmentMessages();
    };

    const handleUpdateAssessment = async (e) => {
        e.preventDefault();
        clearAssessmentMessages();

        if (!editingAssessment.assessment_title || !editingAssessment.assessment_type || !editingAssessment.associated_course_id || !editingAssessment.duration_minutes || !editingAssessment.passing_score_percent) {
            setAssessmentError('Please fill in all assessment fields for editing.');
            clearAssessmentMessages();
            return;
        }

        setAssessmentLoading(true);
        try {
            await axios.put(`${backendUrl}/assessments/${editingAssessmentId}`, {
                ...editingAssessment,
                duration_minutes: parseInt(editingAssessment.duration_minutes),
                passing_score_percent: parseFloat(editingAssessment.passing_score_percent),
                associated_course_id: parseInt(editingAssessment.associated_course_id)
            });
            setAssessmentMessage('Assessment updated successfully!');
            setEditingAssessmentId(null);
            setEditingAssessment({});
            fetchAssessments();
            clearAssessmentMessages();
        } catch (err) {
            console.error('Update assessment error:', err);
            setAssessmentError('Failed to update assessment: ' + (err.response?.data?.error || 'Server error.'));
            clearAssessmentMessages();
        } finally {
            setAssessmentLoading(false);
        }
    };

    const handleDeleteAssessment = async (id) => {
        if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
            setAssessmentLoading(true);
            setAssessmentError('');
            try {
                await axios.delete(`${backendUrl}/assessments/${id}`);
                setAssessmentMessage('Assessment deleted successfully!');
                fetchAssessments();
                clearAssessmentMessages();
            } catch (err) {
                console.error('Delete assessment error:', err);
                setAssessmentError('Failed to delete assessment: ' + (err.response?.data?.error || 'Server error.'));
                clearAssessmentMessages();
            } finally {
                setAssessmentLoading(false);
            }
        }
    };

    // Actual logout functionality
    const handleLogout = () => {
        // In a real application, you would:
        // 1. Clear authentication tokens (e.g., localStorage.removeItem('token'))
        // 2. Redirect to the login page
        alert('Logging out... Redirecting to login page.');
        // This will cause a full page reload and redirect to /login
        window.location.href = '/login'; // Or whatever your login page URL is
    };

    // Helper to get course title by ID for display
    const getCourseTitle = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : 'N/A';
    };

    return (
        <div className="lecturer-dashboard-layout">
            <aside className="sidebar">
                <nav>
                    <ul>
                        <li>
                            <button
                                onClick={() => setActiveSection('dashboard')}
                                className={`sidebar-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                            >
                                <span className="icon">🏠</span> Dashboard
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveSection('my-courses')}
                                className={`sidebar-link ${activeSection === 'my-courses' ? 'active' : ''}`}
                            >
                                <span className="icon">📚</span> My Courses
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveSection('course-editor')}
                                className={`sidebar-link ${activeSection === 'course-editor' ? 'active' : ''}`}
                            >
                                <span className="icon">✏️</span> Course Editor
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveSection('file-upload')}
                                className={`sidebar-link ${activeSection === 'file-upload' ? 'active' : ''}`}
                            >
                                <span className="icon">📤</span> File Upload
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveSection('assessment-builder')}
                                className={`sidebar-link ${activeSection === 'assessment-builder' ? 'active' : ''}`}
                            >
                                <span className="icon">📝</span> Assessment Builder
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveSection('learner-progress')}
                                className={`sidebar-link ${activeSection === 'learner-progress' ? 'active' : ''}`}
                            >
                                <span className="icon">📈</span> Learner Progress
                            </button>
                        </li>
                    </ul>
                </nav>
                <button onClick={handleLogout} className="logout-button sidebar-link">
                    <span className="icon">➡️</span> Logout
                </button>
            </aside>

            <main className="dashboard-main-content">
                <header className="dashboard-header">
                    <h1>Lecturer Dashboard</h1>
                </header>

                <div className="dashboard-content">
                    {/* General messages for all operations */}
                    {message && <div className="message success full-width-section">{message}</div>}
                    {error && <div className="message error full-width-section">{error}</div>}

                    {/* Conditional Rendering based on activeSection */}

                    {activeSection === 'dashboard' && (
                        <div className="dashboard-section full-width-section">
                            <h2>Welcome to Your Lecturer Dashboard!</h2>
                            <p className="placeholder-content">
                                This is your central hub. Use the navigation on the left to manage your courses, edit course details, or upload course materials.
                            </p>
                        </div>
                    )}

                    {activeSection === 'my-courses' && (
                        <div className="dashboard-section my-modules full-width-section">
                            <h2>My Courses / Modules</h2>
                            <h3>Manage Your Course Offerings</h3>
                            {loading && <div className="loading-message">Loading courses...</div>}
                            {!loading && courses.length > 0 ? (
                                <div className="data-table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Description</th>
                                                <th>Credits</th>
                                                <th>Lecturer ID</th>
                                                <th>Pages</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.map(course => (
                                                <tr key={course.id}>
                                                    <td data-label="Title">
                                                        {editingCourseId === course.id ? (
                                                            <input
                                                                type="text"
                                                                name="title"
                                                                value={editingCourse.title || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            course.title
                                                        )}
                                                    </td>
                                                    <td data-label="Description">
                                                        {editingCourseId === course.id ? (
                                                            <textarea
                                                                name="description"
                                                                value={editingCourse.description || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                                className="table-textarea"
                                                            />
                                                        ) : (
                                                            course.description
                                                        )}
                                                    </td>
                                                    <td data-label="Credits">
                                                        {editingCourseId === course.id ? (
                                                            <input
                                                                type="number"
                                                                name="credits"
                                                                value={editingCourse.credits || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            course.credits
                                                        )}
                                                    </td>
                                                    <td data-label="Lecturer ID">
                                                        {editingCourseId === course.id ? (
                                                            <input
                                                                type="number"
                                                                name="lecturer_id"
                                                                value={editingCourse.lecturer_id || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            course.lecturer_id
                                                        )}
                                                    </td>
                                                    <td data-label="Pages">
                                                        {editingCourseId === course.id ? (
                                                            <input
                                                                type="number"
                                                                name="pages"
                                                                value={editingCourse.pages || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                                min="1"
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            course.pages
                                                        )}
                                                    </td>
                                                    <td data-label="Actions" className="actions-cell">
                                                        {editingCourseId === course.id ? (
                                                            <>
                                                                <button onClick={handleUpdateCourse} className="save-button" disabled={loading}>Save</button>
                                                                <button onClick={() => { setEditingCourseId(null); setEditingCourse({}); clearMessages(); }} className="cancel-button" disabled={loading}>Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditCourse(course)} className="edit-button" disabled={loading}>Edit</button>
                                                                <button onClick={() => handleDeleteCourse(course.id)} className="delete-button" disabled={loading}>Delete</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                !loading && <p className="placeholder-content">No courses available. Use the Course Editor to add your first course!</p>
                            )}
                        </div>
                    )}

                    {activeSection === 'course-editor' && (
                        <div className="dashboard-section module-editor full-width-section">
                            <h2>Course Editor</h2>
                            <h3>Add or Modify Course Details</h3>
                            <form onSubmit={handleAddCourse} className="course-form">
                                <div className="form-group">
                                    <label htmlFor="new-title">Course Title:</label>
                                    <input
                                        id="new-title"
                                        name="title"
                                        placeholder="e.g., Introduction to React"
                                        value={newCourse.title}
                                        onChange={(e) => handleInputChange(e, setNewCourse)}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="new-description">Course Description:</label>
                                    <textarea
                                        id="new-description"
                                        name="description"
                                        placeholder="A brief overview of the course content."
                                        value={newCourse.description}
                                        onChange={(e) => handleInputChange(e, setNewCourse)}
                                        className="form-textarea"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="new-credits">Credits:</label>
                                    <input
                                        id="new-credits"
                                        type="number"
                                        name="credits"
                                        placeholder="e.g., 3"
                                        value={newCourse.credits}
                                        onChange={(e) => handleInputChange(e, setNewCourse)}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="new-lecturer-id">Your Lecturer ID:</label>
                                    <input
                                        id="new-lecturer-id"
                                        type="number"
                                        name="lecturer_id"
                                        placeholder="e.g., 101"
                                        value={newCourse.lecturer_id}
                                        onChange={(e) => handleInputChange(e, setNewCourse)}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="new-pages">Number of Pages:</label>
                                    <input
                                        id="new-pages"
                                        type="number"
                                        name="pages"
                                        placeholder="e.g., 10"
                                        value={newCourse.pages}
                                        onChange={(e) => handleInputChange(e, setNewCourse)}
                                        min="1"
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <button type="submit" className="submit-button" disabled={loading}>
                                    {loading ? 'Adding...' : 'Add Course'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeSection === 'file-upload' && (
                        <div className="dashboard-section file-upload full-width-section">
                            <h2>File Upload</h2>
                            <h3>Upload Course Materials</h3>
                            <div className="upload-area">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="file-input"
                                />
                                <button onClick={handleFileUpload} className="upload-button" disabled={uploading || !selectedFile}>
                                    {uploading ? 'Uploading...' : 'Upload File(s)'}
                                </button>
                                {uploadMessage && <div className="message success">{uploadMessage}</div>}
                                {uploadError && <div className="message error">{uploadError}</div>}
                            </div>
                        </div>
                    )}

                    {/* --- ASSESSMENT BUILDER SECTION --- */}
                    {activeSection === 'assessment-builder' && (
                        <div className="dashboard-section assessment-builder full-width-section">
                            <h2>Assessment Builder</h2>
                            <h3>Create and Manage Course Assessments</h3>

                            {assessmentMessage && <div className="message success">{assessmentMessage}</div>}
                            {assessmentError && <div className="message error">{assessmentError}</div>}

                            <h4>Add New Assessment</h4>
                            <form onSubmit={handleAddAssessment} className="assessment-form">
                                <div className="form-group">
                                    <label htmlFor="assessment-title">Assessment Title:</label>
                                    <input
                                        id="assessment-title"
                                        name="assessment_title"
                                        placeholder="e.g., React Final Exam"
                                        value={newAssessment.assessment_title}
                                        onChange={(e) => handleInputChange(e, setNewAssessment)}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="assessment-type">Assessment Type:</label>
                                    <select
                                        id="assessment-type"
                                        name="assessment_type"
                                        value={newAssessment.assessment_type}
                                        onChange={(e) => handleInputChange(e, setNewAssessment)}
                                        required
                                        className="form-select"
                                    >
                                        <option value="Quiz">Quiz</option>
                                        <option value="Exam">Exam</option>
                                        <option value="Assignment">Assignment</option>
                                        <option value="Project">Project</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="associated-course">Associated Course:</label>
                                    <select
                                        id="associated-course"
                                        name="associated_course_id"
                                        value={newAssessment.associated_course_id}
                                        onChange={(e) => handleInputChange(e, setNewAssessment)}
                                        required
                                        className="form-select"
                                    >
                                        <option value="">Select a Course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="duration-minutes">Duration (minutes):</label>
                                    <input
                                        id="duration-minutes"
                                        type="number"
                                        name="duration_minutes"
                                        placeholder="e.g., 60"
                                        value={newAssessment.duration_minutes}
                                        onChange={(e) => handleInputChange(e, setNewAssessment)}
                                        min="1"
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="passing-score">Passing Score (%):</label>
                                    <input
                                        id="passing-score"
                                        type="number"
                                        name="passing_score_percent"
                                        placeholder="e.g., 50"
                                        value={newAssessment.passing_score_percent}
                                        onChange={(e) => handleInputChange(e, setNewAssessment)}
                                        min="0"
                                        max="100"
                                        step="0.01" // Allow decimal for percentage
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <button type="submit" className="submit-button" disabled={assessmentLoading}>
                                    {assessmentLoading ? 'Adding Assessment...' : 'Add Assessment'}
                                </button>
                            </form>

                            <h4 className="mt-4">Existing Assessments</h4>
                            {assessmentLoading && <div className="loading-message">Loading assessments...</div>}
                            {!assessmentLoading && assessments.length > 0 ? (
                                <div className="data-table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Type</th>
                                                <th>Course</th>
                                                <th>Duration (min)</th>
                                                <th>Passing Score (%)</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assessments.map(assessment => (
                                                <tr key={assessment.assessment_id}>
                                                    <td data-label="Title">
                                                        {editingAssessmentId === assessment.assessment_id ? (
                                                            <input
                                                                type="text"
                                                                name="assessment_title"
                                                                value={editingAssessment.assessment_title || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingAssessment)}
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            assessment.assessment_title
                                                        )}
                                                    </td>
                                                    <td data-label="Type">
                                                        {editingAssessmentId === assessment.assessment_id ? (
                                                            <select
                                                                name="assessment_type"
                                                                value={editingAssessment.assessment_type || 'Quiz'}
                                                                onChange={(e) => handleInputChange(e, setEditingAssessment)}
                                                                className="table-input"
                                                            >
                                                                <option value="Quiz">Quiz</option>
                                                                <option value="Exam">Exam</option>
                                                                <option value="Assignment">Assignment</option>
                                                                <option value="Project">Project</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        ) : (
                                                            assessment.assessment_type
                                                        )}
                                                    </td>
                                                    <td data-label="Course">
                                                        {editingAssessmentId === assessment.assessment_id ? (
                                                            <select
                                                                name="associated_course_id"
                                                                value={editingAssessment.associated_course_id || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingAssessment)}
                                                                className="table-input"
                                                            >
                                                                <option value="">Select a Course</option>
                                                                {courses.map(course => (
                                                                    <option key={course.id} value={course.id}>
                                                                        {course.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            getCourseTitle(assessment.associated_course_id)
                                                        )}
                                                    </td>
                                                    <td data-label="Duration (min)">
                                                        {editingAssessmentId === assessment.assessment_id ? (
                                                            <input
                                                                type="number"
                                                                name="duration_minutes"
                                                                value={editingAssessment.duration_minutes || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingAssessment)}
                                                                min="1"
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            assessment.duration_minutes
                                                        )}
                                                    </td>
                                                    <td data-label="Passing Score (%)">
                                                        {editingAssessmentId === assessment.assessment_id ? (
                                                            <input
                                                                type="number"
                                                                name="passing_score_percent"
                                                                value={editingAssessment.passing_score_percent || ''}
                                                                onChange={(e) => handleInputChange(e, setEditingAssessment)}
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                className="table-input"
                                                            />
                                                        ) : (
                                                            `${assessment.passing_score_percent}%`
                                                        )}
                                                    </td>
                                                    <td data-label="Actions" className="actions-cell">
                                                        {editingAssessmentId === assessment.assessment_id ? (
                                                            <>
                                                                <button onClick={handleUpdateAssessment} className="save-button" disabled={assessmentLoading}>Save</button>
                                                                <button onClick={() => { setEditingAssessmentId(null); setEditingAssessment({}); clearAssessmentMessages(); }} className="cancel-button" disabled={assessmentLoading}>Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditAssessment(assessment)} className="edit-button" disabled={assessmentLoading}>Edit</button>
                                                                <button onClick={() => handleDeleteAssessment(assessment.assessment_id)} className="delete-button" disabled={assessmentLoading}>Delete</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                !assessmentLoading && <p className="placeholder-content">No assessments available. Add one using the form above!</p>
                            )}
                        </div>
                    )}

                    {activeSection === 'learner-progress' && (
                        <div className="dashboard-section learner-progress full-width-section">
                            <h2>Learner Progress</h2>
                            <h3>Track Student Performance</h3>
                            {learnerProgressLoading && <div className="loading-message">Loading learner progress...</div>}
                            {learnerProgressError && <div className="message error">{learnerProgressError}</div>}
                            {!learnerProgressLoading && learnerScores.length > 0 ? (
                                <div className="data-table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Learner Name</th>
                                                <th>Course Title</th>
                                                <th>Assessment Title</th>
                                                <th>Score (%)</th>
                                                {/* Add more columns as needed for progress tracking */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Example structure for learnerScores, adjust based on your actual data */}
                                            {learnerScores.map((score, index) => (
                                                <tr key={index}>
                                                    <td data-label="Learner Name">{score.learner_name}</td>
                                                    <td data-label="Course Title">{score.course_title}</td>
                                                    <td data-label="Assessment Title">{score.assessment_title}</td>
                                                    <td data-label="Score (%)">{score.score}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                !learnerProgressLoading && !learnerProgressError && <p className="placeholder-content">No learner progress data available yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LecturerDashboard;