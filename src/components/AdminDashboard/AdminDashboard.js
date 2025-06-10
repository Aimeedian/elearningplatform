import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css'; // This line correctly links your CSS file
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const AdminDashboard = () => {
    const backendUrl = 'http://localhost:5000';
    const navigate = useNavigate(); // Initialize useNavigate hook

    // State for Module Management
    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState({
        title: '',
        description: '',
        credits: '',
        lecturer_id: '',
        pages: '',
        is_published: true // Default to published
    });

    // State for User Management
    const [users, setUsers] = useState([]);

    // State for Reports
    const [enrollmentStats, setEnrollmentStats] = useState([]);
    const [completionRates, setCompletionRates] = useState([]);
    const [revenueReport, setRevenueReport] = useState(null); // Assuming a single object for revenue report

    // General UI states
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'users', 'reports'
    // New state to manage visibility of the Add New Module form
    const [showAddModuleForm, setShowAddModuleForm] = useState(false); // Changed default to false
    // New state to manage visibility of the Existing Modules section
    const [showExistingModules, setShowExistingModules] = useState(true); // Added new state, default to true for initial display

    // Helper to clear messages after a delay
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000); // Clear messages after 5 seconds
    };

    useEffect(() => {
        // Fetch data when component mounts or activeTab changes
        if (activeTab === 'modules') {
            fetchModules();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'reports') {
            fetchReports();
        }
    }, [activeTab]); // Dependency array includes activeTab

    // --- Module Management Functions ---
    const fetchModules = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/admin/modules`);
            setModules(response.data);
        } catch (err) {
            console.error('Error fetching modules:', err);
            setError('Failed to fetch modules.');
        } finally {
            setLoading(false);
        }
    };

    const handleModuleInputChange = (e, setter) => {
        const { name, value, type, checked } = e.target;
        setter(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        // Basic client-side validation
        if (!newModule.title.trim() || !newModule.credits || !newModule.lecturer_id || newModule.pages === '') {
            setError('Please fill in all required fields for the new module (Title, Credits, Lecturer ID, Pages).');
            clearMessages();
            return;
        }
        if (isNaN(newModule.credits) || newModule.credits <= 0) {
            setError('Credits must be a positive number.');
            clearMessages();
            return;
        }
        if (isNaN(newModule.lecturer_id) || newModule.lecturer_id <= 0) {
            setError('Lecturer ID must be a positive number.');
            clearMessages();
            return;
        }
        if (isNaN(newModule.pages) || newModule.pages < 0) {
            setError('Pages must be a non-negative number.');
            clearMessages();
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.post(`${backendUrl}/admin/modules`, newModule);
            setMessage('Module added successfully!');
            setNewModule({ title: '', description: '', credits: '', lecturer_id: '', pages: '', is_published: true });
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Add module error:', err);
            setError('Failed to add module: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteModule = async (id) => {
        if (window.confirm('Are you sure you want to delete this module? This will also delete related enrollments!')) {
            setLoading(true);
            setError('');
            try {
                await axios.delete(`${backendUrl}/admin/modules/${id}`);
                setMessage('Module deleted successfully!');
                fetchModules();
                clearMessages();
            } catch (err) {
                console.error('Delete module error:', err);
                setError('Failed to delete module: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePublishToggle = async (moduleId, currentStatus) => {
        setLoading(true);
        setError('');
        try {
            await axios.put(`${backendUrl}/admin/modules/${moduleId}/publish`, { is_published: !currentStatus });
            setMessage(`Module ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Publish toggle error:', err);
            setError(`Failed to ${!currentStatus ? 'publish' : 'unpublish'} module: ` + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleAssignInstructor = async (moduleId, currentLecturerId) => {
        const newLecturerIdInput = prompt(`Enter new Lecturer ID for module ${moduleId}:`, currentLecturerId || '');

        if (newLecturerIdInput === null) {
            setMessage('Instructor assignment cancelled.');
            clearMessages();
            return;
        }

        const newLecturerId = parseInt(newLecturerIdInput);

        if (isNaN(newLecturerId) || newLecturerId <= 0) {
            setError('Invalid Lecturer ID. Please enter a positive number.');
            clearMessages();
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.put(`${backendUrl}/admin/modules/${moduleId}/assign-instructor`, { lecturer_id: newLecturerId });
            setMessage('Instructor assigned successfully!');
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Assign instructor error:', err);
            setError('Failed to assign instructor. Check if ID is valid and belongs to a lecturer: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // --- User Management Functions ---
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/admin/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteUser = async (userId, currentRole) => {
        if (currentRole === 'admin') {
            alert("Cannot change role of an Admin directly from here. Please manage admin roles directly in the database if necessary.");
            return;
        }

        const newRole = currentRole === 'lecturer' ? 'learner' : 'lecturer';

        if (window.confirm(`Are you sure you want to change user ${userId}'s role to ${newRole}?`)) {
            setLoading(true);
            setError('');
            try {
                await axios.put(`${backendUrl}/admin/users/${userId}/promote`, { role: newRole });
                setMessage(`User role updated to ${newRole} successfully!`);
                fetchUsers();
                clearMessages();
            } catch (err) {
                console.error('Promote user error:', err);
                setError('Failed to update user role: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';

        if (window.confirm(`Are you sure you want to ${newStatus} user ${userId}?`)) {
            setLoading(true);
            setError('');
            try {
                await axios.put(`${backendUrl}/admin/users/${userId}/status`, { status: newStatus });
                setMessage(`User status set to ${newStatus} successfully!`);
                fetchUsers();
                clearMessages();
            } catch (err) {
                console.error('Toggle user status error:', err);
                setError('Failed to update user status: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this user and all their enrollments?')) {
            setLoading(true);
            setError('');
            try {
                await axios.delete(`${backendUrl}/admin/users/${id}`);
                setMessage('User deleted successfully!');
                fetchUsers();
                clearMessages();
            } catch (err) {
                console.error('Delete user error:', err);
                setError('Failed to delete user: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    // --- System Reports Functions ---
    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            const [enrollmentsRes, completionsRes, revenueRes] = await Promise.all([
                axios.get(`${backendUrl}/admin/reports/enrollments`),
                axios.get(`${backendUrl}/admin/reports/completion-rates`),
                axios.get(`${backendUrl}/admin/reports/revenue`) // Placeholder
            ]);
            setEnrollmentStats(enrollmentsRes.data);
            setCompletionRates(completionsRes.data);
            setRevenueReport(revenueRes.data);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to fetch reports.');
        } finally {
            setLoading(false);
        }
    };

    // --- Logout Function ---
    const handleLogout = () => {
        // Clear any authentication tokens or user data from local storage/session storage
        localStorage.removeItem('authToken'); // Example: if you store a token
        localStorage.removeItem('userRole'); // Example: if you store user role

        // Redirect to the login page or home page
        navigate('/login'); // Assuming you have a '/login' route set up with React Router
        // Or if you don't use React Router, you could do: window.location.href = '/login';
    };

    // Function to toggle the visibility of the Add New Module form
    const toggleAddModuleFormVisibility = () => {
        setShowAddModuleForm(prev => !prev);
        // When showing the Add New Module form, hide Existing Modules
        if (!showAddModuleForm) {
            setShowExistingModules(false);
        }
    };

    // Function to toggle the visibility of the Existing Modules section
    const toggleExistingModulesVisibility = () => {
        setShowExistingModules(prev => !prev);
        // When showing Existing Modules, hide the Add New Module form
        if (!showExistingModules) {
            setShowAddModuleForm(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Admin Dashboard</h1>
            <p>Welcome, Administrator!</p>

            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}
            {loading && <div className="loading-message">Loading...</div>}

            <div className="tab-navigation">
                <button
                    onClick={() => setActiveTab('modules')}
                    className={activeTab === 'modules' ? 'active' : ''}
                >
                    Module Management
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={activeTab === 'users' ? 'active' : ''}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={activeTab === 'reports' ? 'active' : ''}
                >
                    System Reports
                </button>
                {/* "Exit Module" (Logout) button */}
                <button
                    onClick={handleLogout}
                    className="exit-button" // Add a new CSS class for styling
                >
                    Exit Module (Logout)
                </button>
            </div>

            {/* Module Management Tab */}
            {activeTab === 'modules' && (
                <div className="module-management-section">
                    <h2 className="section-title">Module Management</h2>

                    {/* Buttons to toggle sections */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', }}>
                        <button
                            onClick={toggleAddModuleFormVisibility}
                            className="toggle-form-button"
                        >
                            {showAddModuleForm ? 'Hide Add New Module Form' : 'Add New Module'}
                        </button>
                        <button
                            onClick={toggleExistingModulesVisibility}
                            className="toggle-form-button"
                            style={{ marginLeft: '20px' }} // Optional: add some spacing
                        >
                            {showExistingModules ? 'Hide Existing Modules' : 'Show Existing Modules'}
                        </button>
                    </div>

                    {/* Conditionally render the "Add New Module" form */}
                    {showAddModuleForm && (
                        <>
                            <h3>Add New Module</h3>
                            <form onSubmit={handleAddModule} className="module-form">
                                <input
                                    name="title"
                                    placeholder="Title"
                                    value={newModule.title}
                                    onChange={(e) => handleModuleInputChange(e, setNewModule)}
                                    required
                                    className="form-input"
                                /><br />
                                <textarea
                                    name="description"
                                    placeholder="Description"
                                    value={newModule.description}
                                    onChange={(e) => handleModuleInputChange(e, setNewModule)}
                                    className="form-textarea"
                                /><br />
                                <input
                                    type="number"
                                    name="credits"
                                    placeholder="Credits"
                                    value={newModule.credits}
                                    onChange={(e) => handleModuleInputChange(e, setNewModule)}
                                    required
                                    className="form-input"
                                    min="1"
                                /><br />
                                <input
                                    type="number"
                                    name="lecturer_id"
                                    placeholder="Lecturer ID"
                                    value={newModule.lecturer_id}
                                    onChange={(e) => handleModuleInputChange(e, setNewModule)}
                                    required
                                    className="form-input"
                                    min="1"
                                /><br />
                                <input
                                    type="number"
                                    name="pages"
                                    placeholder="Number of Pages"
                                    value={newModule.pages}
                                    onChange={(e) => handleModuleInputChange(e, setNewModule)}
                                    required
                                    min="0"
                                    className="form-input"
                                /><br />
                                <label className="form-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_published"
                                        checked={newModule.is_published}
                                        onChange={(e) => handleModuleInputChange(e, setNewModule)}
                                    />
                                    Published
                                </label><br />
                                <button type="submit" className="add-button">Add Module</button>
                            </form>
                        </>
                    )}

                    {/* Conditionally render the "Existing Modules" section */}
                    {showExistingModules && (
                        <>
                            <h3 className="section-title">Existing Modules</h3>
                            {loading && <p>Loading modules...</p>}
                            {!loading && modules.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Description</th>
                                            <th>Credits</th>
                                            <th>Lecturer ID</th>
                                            <th>Pages</th>
                                            <th>Published</th>
                                            <th>Enrollments</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modules.map(module => (
                                            <tr key={module.id}>
                                                <td data-label="ID">{module.id}</td>
                                                <td data-label="Title">{module.title}</td>
                                                <td data-label="Description">{module.description}</td>
                                                <td data-label="Credits">{module.credits}</td>
                                                <td data-label="Lecturer ID">{module.lecturer_id}</td>
                                                <td data-label="Pages">{module.pages}</td>
                                                <td data-label="Published">
                                                    {module.is_published ? 'Yes' : 'No'}
                                                </td>
                                                <td data-label="Enrollments">{module.enrollment_count || 0}</td>
                                                <td data-label="Actions" className="actions-cell">
                                                    <button onClick={() => handleDeleteModule(module.id)} className="delete-button">Delete</button>
                                                    <button onClick={() => handlePublishToggle(module.id, module.is_published)} className={module.is_published ? 'unpublish-button' : 'publish-button'}>
                                                        {module.is_published ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <button onClick={() => handleAssignInstructor(module.id, module.lecturer_id)} className="assign-button">Assign Instructor</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                !loading && <p>No modules available.</p>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div className="user-management-section">
                    <h2 className="section-title">User Management</h2>
                    {loading && <p>Loading users...</p>}
                    {!loading && users.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td data-label="ID">{user.id}</td>
                                        <td data-label="First Name">{user.firstname}</td>
                                        <td data-label="Last Name">{user.lastname}</td>
                                        <td data-label="Username">{user.username}</td>
                                        <td data-label="Email">{user.email}</td>
                                        <td data-label="Role">
                                            {user.role}
                                            {user.role === 'admin' && <span className="user-role-admin-tag"> (Admin)</span>}
                                        </td>
                                        <td data-label="Status">{user.status}</td>
                                        <td data-label="Actions" className="actions-cell">
                                            {user.role !== 'admin' ? ( // Prevent admin from being promoted/disabled
                                                <>
                                                    <button onClick={() => handleToggleUserStatus(user.id, user.status)} className={user.status === 'active' ? 'disable-button' : 'activate-button'}>
                                                        {user.status === 'active' ? 'Disable' : 'Activate'}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="delete-button">Delete</button>
                                                </>
                                            ) : (
                                                <span className="user-role-admin-tag">Admin Account</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        !loading && <p>No users available.</p>
                    )}
                </div>
            )}

            {/* System Reports Tab */}
            {activeTab === 'reports' && (
                <div className="reports-section">
                    <h2 className="section-title">System Reports</h2>
                    {loading && <p>Loading reports...</p>}
                    {!loading && (
                        <>
                            <h3>Enrollment Statistics</h3>
                            {enrollmentStats.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Course Title</th>
                                            <th>Total Enrollments</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollmentStats.map((stat, index) => (
                                            <tr key={index}> {/* Using index as key here, consider a unique ID if available */}
                                                <td data-label="Course Title">{stat.course_title}</td>
                                                <td data-label="Total Enrollments">{stat.total_enrollments}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No enrollment statistics available.</p>
                            )}

                            <h3 className="section-title">Module Completion Rates</h3>
                            {completionRates.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Course Title</th>
                                            <th>Total Enrollments</th>
                                            <th>Completed Enrollments</th>
                                            <th>Completion Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completionRates.map((rate, index) => (
                                            <tr key={index}> {/* Using index as key here, consider a unique ID if available */}
                                                <td data-label="Course Title">{rate.course_title}</td>
                                                <td data-label="Total Enrollments">{rate.total_enrollments}</td>
                                                <td data-label="Completed Enrollments">{rate.completed_enrollments}</td>
                                                <td data-label="Completion Percentage">
                                                    {rate.completion_percentage ? `${rate.completion_percentage.toFixed(2)}%` : '0.00%'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No module completion rates available.</p>
                            )}

                            <h3 className="section-title">Revenue Report</h3>
                            {revenueReport ? (
                                <div className="revenue-report">
                                    <p><strong>Total Revenue:</strong> ${revenueReport.total_revenue ? revenueReport.total_revenue.toFixed(2) : '0.00'}</p>
                                    {/* Add more revenue details as needed */}
                                </div>
                            ) : (
                                <p>No revenue report available.</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;