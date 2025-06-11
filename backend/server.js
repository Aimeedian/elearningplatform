const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
// Consider using dotenv for environment variables (e.g., for email credentials)
// const dotenv = require('dotenv');
// dotenv.config();

const app = express();
const port = 5000;

// ============================
// MIDDLEWARE
// ============================
app.use(cors()); // Enable CORS for all origins (restrict in production for security)
app.use(express.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
// express.json() is generally preferred for JSON requests.
// bodyParser.urlencoded is needed for traditional HTML form submissions.

// ============================
// 1. COURSES ROUTES (CRITICAL: Move to DB for persistence!)
// ============================
// NOTE: These routes currently use in-memory arrays.
// For a persistent application, you MUST store courses, assessments,
// and learnerScores in the MySQL database.
//
// Placeholder in-memory arrays (for demonstration if DB is not set up for these yet)
let courses = [];
let assessments = [];
let learnerScores = [];

// GET all courses (in-memory)
app.get('/courses', (req, res) => {
    // In a real application, fetch from DB:
    // db.query('SELECT * FROM courses', (err, results) => { ... });
    res.json(courses);
});

// POST a new course (in-memory)
app.post('/courses', (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Course title is required.' });
    }
    const newCourse = {
        id: courses.length + 1,
        title,
        description: description || null // Allow description to be optional
    };
    courses.push(newCourse);
    res.status(201).json(newCourse);
    // In a real application, insert into DB:
    // db.query('INSERT INTO courses (title, description) VALUES (?, ?)', [title, description], (err, result) => { ... });
});

// ============================
// 2. ASSESSMENTS ROUTES (CRITICAL: Move to DB for persistence!)
// ============================

// GET all assessments (in-memory)
app.get('/assessments', (req, res) => {
    // In a real application, fetch from DB:
    // db.query('SELECT * FROM assessments', (err, results) => { ... });
    res.json(assessments);
});

// POST a new assessment (in-memory)
app.post('/assessments', (req, res) => {
    const { title, courseId } = req.body;
    if (!title || courseId === undefined) {
        return res.status(400).json({ error: 'Assessment title and courseId are required.' });
    }
    const newAssessment = {
        id: assessments.length + 1,
        title,
        courseId
    };
    assessments.push(newAssessment);
    res.status(201).json(newAssessment);
    // In a real application, insert into DB:
    // db.query('INSERT INTO assessments (title, course_id) VALUES (?, ?)', [title, courseId], (err, result) => { ... });
});

// ============================
// 3. LEARNER SCORES ROUTES (CRITICAL: Move to DB for persistence!)
// ============================

// GET all learner scores (in-memory)
app.get('/learner_scores', (req, res) => {
    // In a real application, fetch from DB:
    // db.query('SELECT * FROM learner_scores', (err, results) => { ... });
    res.json(learnerScores);
});

// POST a new learner score (in-memory)
app.post('/learner_scores', (req, res) => {
    const { learnerId, courseId, score } = req.body;
    if (!learnerId || !courseId || score === undefined) {
        return res.status(400).json({ error: 'Learner ID, Course ID, and Score are required.' });
    }
    const newScore = { learnerId, courseId, score };
    learnerScores.push(newScore);
    res.status(201).json(newScore);
    // In a real application, insert into DB:
    // db.query('INSERT INTO learner_scores (learner_id, course_id, score) VALUES (?, ?, ?)', [learnerId, courseId, score], (err, result) => { ... });
});

// ============================
// 4. FILE UPLOAD ROUTE
// ============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure 'uploads/' directory exists in your project root
        // You might want to handle directory creation or check for its existence
        // fs.mkdirSync('uploads/', { recursive: true });
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Use a more robust filename generation or sanitize originalname
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Example: 5MB file size limit
    // fileFilter: (req, file, cb) => {
    //     // Example: Only allow certain file types
    //     if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    //         cb(null, true);
    //     } else {
    //         cb(new Error('Only JPEG and PNG files are allowed!'), false);
    //     }
    // }
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        // Check for Multer errors (e.g., file size limit exceeded)
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError });
        }
        return res.status(400).json({ message: 'No file uploaded or file type not allowed.' });
    }
    console.log('File uploaded:', req.file.filename);
    res.json({ message: 'File uploaded successfully', file: req.file });
});

// Serve static files (e.g., uploaded files)
app.use('/uploads', express.static('uploads'));

// ============================
// MYSQL DATABASE CONNECTION
// ============================
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // IMPORTANT: REPLACE WITH YOUR ACTUAL MYSQL PASSWORD if you have one set
    database: 'elearning'
};

const db = mysql.createConnection(dbConfig);

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('ERROR: Could not connect to MySQL database:', err.stack);
        process.exit(1); // Exit if DB connection fails at startup
    }
    console.log('SUCCESS: Connected to MySQL database as id ' + db.threadId);
});

// ============================
// NODEMAILER SETUP
// ============================
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: 'your_email@example.com', // REPLACE THIS with your actual sending email
        pass: 'your_email_password',    // REPLACE THIS with your actual password or App Password
    },
    // For debugging Nodemailer issues:
    // logger: true,
    // debug: true,
});

// --- Helper function to send emails ---
const sendEmail = async (toEmail, subject, htmlContent) => {
    if (!transporter.options.auth.user || transporter.options.auth.user === 'your_email@example.com') {
        console.error('ERROR: Nodemailer transporter not configured. Please set up your email credentials.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"E-Learning Platform" <your_email@example.com>', // Sender address, REPLACE THIS with your email
            to: toEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Email sent successfully to ${toEmail} for subject: "${subject}". Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`ERROR: Failed to send email to ${toEmail} with subject "${subject}":`, error);
        console.error('Nodemailer error details:', error.response);
        console.error('--- COMMON EMAIL SENDING ISSUES & FIXES ---');
        console.error('1. Incorrect "user" or "pass" in Nodemailer config.');
        console.error('2. For Gmail: Did you use an "App Password" if 2FA is ON? (https://support.google.com/accounts/answer/185833)');
        console.error('3. For Gmail: Is "Less secure app access" enabled if 2FA is OFF? (No longer recommended by Google)');
        console.error('4. Network firewall blocking outgoing SMTP (ports 465/587).');
        console.error('5. Recipient email address might be invalid or rejecting emails.');
    }
};

// ============================
// API ENDPOINTS
// ============================

// User Registration
app.post('/registration', async (req, res) => {
    const { firstname, lastname, username, email, password, role } = req.body;

    if (!firstname || !lastname || !username || !email || !password || !role) {
        console.error('ERROR: Registration - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All fields are required for registration.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('ERROR: Registration - Invalid email format.');
        return res.status(400).json({ error: 'ERROR: Invalid email format.' });
    }

    try {
        const checkUserSql = 'SELECT * FROM registration WHERE username = ? OR email = ?';
        db.query(checkUserSql, [username, email], async (checkErr, checkResults) => {
            if (checkErr) {
                console.error('ERROR: Database error checking existing user during registration:', checkErr.stack);
                return res.status(500).json({ error: 'ERROR: Database error during registration.' });
            }

            if (checkResults.length > 0) {
                console.warn('WARNING: Registration attempt with existing username or email:', username, email);
                return res.status(409).json({ error: 'ERROR: Username or email already exists.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const insertSql = 'INSERT INTO registration (firstname, lastname, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, "active")';
            db.query(insertSql, [firstname, lastname, username, email, hashedPassword, role], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('ERROR: Database error registering user:', insertErr.stack);
                    return res.status(500).json({ error: 'ERROR: Database error during registration.' });
                }
                console.log('SUCCESS: User registered successfully:', insertResult.insertId);
                return res.status(201).json({ message: 'SUCCESS: Registration successful!' });
            });
        });
    } catch (error) {
        console.error('ERROR: Uncaught error during registration process:', error.stack);
        return res.status(500).json({ error: 'ERROR: Internal server error during registration.' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.error('ERROR: Login - Username and password are required.');
        return res.status(400).json({ error: 'ERROR: Username and password are required.' });
    }

    const sql = 'SELECT id, username, password, role, status, email FROM registration WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('ERROR: Database error during login query:', err.stack);
            return res.status(500).json({ error: 'ERROR: Database error during login.' });
        }

        if (results.length === 0) {
            console.warn('WARNING: Login attempt with non-existent username:', username);
            return res.status(401).json({ error: 'ERROR: Invalid credentials.' });
        }

        const user = results[0];
        if (user.status === 'disabled') {
            console.warn('WARNING: Login attempt for disabled account:', username);
            return res.status(403).json({ error: 'ERROR: Your account has been disabled. Please contact support.' });
        }

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                console.log('SUCCESS: User logged in:', user.username, 'Role:', user.role);
                // In a real app, you'd generate a JWT here for session management
                return res.status(200).json({
                    message: 'SUCCESS: Login successful!',
                    role: user.role,
                    username: user.username,
                    userId: user.id,
                    email: user.email
                });
            } else {
                console.warn('WARNING: Login attempt with incorrect password for user:', username);
                return res.status(401).json({ error: 'ERROR: Invalid credentials.' });
            }
        } catch (bcryptError) {
            console.error('ERROR: Error comparing passwords during login:', bcryptError.stack);
            return res.status(500).json({ error: 'ERROR: Internal server error during login.' });
        }
    });
});

// Password Reset (Basic Implementation - Needs a robust token system in production)
app.post('/reset', (req, res) => {
    const { email } = req.body;

    if (!email) {
        console.error('ERROR: Password Reset - Email is required.');
        return res.status(400).json({ error: 'ERROR: Email is required for password reset.' });
    }

    const sql = 'SELECT id, email, firstname, username FROM registration WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('ERROR: Database error during password reset request:', err.stack);
            return res.status(500).json({ error: 'ERROR: Database error during password reset.' });
        }

        if (results.length === 0) {
            console.warn('WARNING: Password Reset attempt for non-existent email:', email);
            // For security, it's often better to return a generic success message even if the email isn't found
            // to avoid revealing which emails are registered.
            return res.status(200).json({ message: 'INFO: If an account with that email exists, a password reset link has been sent.' });
            // Original line, which is less secure but potentially fine for a learning app:
            // return res.status(404).json({ error: 'ERROR: User with this email not found.' });
        }

        const user = results[0];
        console.log('INFO: Password reset requested for:', user.email);

        // In a real application, you'd generate a unique, time-limited reset token,
        // store it in the database associated with the user, and then include it
        // in a reset link sent to the user's email.
        const resetToken = 'YOUR_GENERATED_SECURE_RESET_TOKEN'; // Placeholder
        const resetLink = `YOUR_FRONTEND_RESET_PAGE_URL_HERE?token=${resetToken}&email=${encodeURIComponent(user.email)}`; // Placeholder

        const resetHtml = `
            <p>Dear ${user.firstname || user.username || 'User'},</p>
            <p>You recently requested a password reset for your E-Learning Platform account.</p>
            <p>Please click on the following link to reset your password: <a href='${resetLink}'>Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>This link is valid for a limited time (e.g., 1 hour).</p>
            <p>Best regards,<br>The E-Learning Platform Team</p>
        `;
        sendEmail(user.email, "E-Learning Platform: Password Reset Request", resetHtml);
        return res.status(200).json({ message: 'INFO: If an account with that email exists, a password reset link has been sent.' });
    });
});

// --- NEW ENROLLMENT ENDPOINTS with Email Notifications ---

// POST: Enroll a learner in a course
app.post('/enrollments', (req, res) => {
    const { userId, moduleId } = req.body;

    if (!userId || !moduleId) {
        console.error('ERROR: Enrollment - User ID and Module ID are required.');
        return res.status(400).json({ error: 'ERROR: User ID and Module ID are required for enrollment.' });
    }

    const checkEnrollmentSql = 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?';
    db.query(checkEnrollmentSql, [userId, moduleId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('ERROR: Database error checking existing enrollment:', checkErr.stack);
            return res.status(500).json({ error: 'ERROR: Database error during enrollment.' });
        }

        if (checkResults.length > 0) {
            console.warn(`WARNING: Enrollment attempt for existing enrollment (User ID: ${userId}, Module ID: ${moduleId}).`);
            return res.status(409).json({ message: 'User is already enrolled in this module.' });
        }

        const insertEnrollmentSql = 'INSERT INTO enrollments (user_id, course_id, enrollment_date, completion_status) VALUES (?, ?, ?, ?)';
        const enrollmentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format for MySQL DATETIME
        db.query(insertEnrollmentSql, [userId, moduleId, enrollmentDate, 'in_progress'], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('ERROR: Database error inserting new enrollment:', insertErr.stack);
                return res.status(500).json({ error: 'ERROR: Failed to enroll in module.', details: insertErr.message });
            }

            const userCourseDetailsSql = `
                SELECT
                    r.email,
                    r.firstname,
                    r.lastname,
                    c.title AS course_title
                FROM registration r
                JOIN courses c ON c.id = ?
                WHERE r.id = ?;
            `;
            db.query(userCourseDetailsSql, [moduleId, userId], (detailsErr, detailsResults) => {
                if (detailsErr) {
                    console.error('ERROR: Database error fetching user/course details for enrollment email:', detailsErr.stack);
                } else if (detailsResults.length > 0 && detailsResults[0].email) {
                    const userDetails = detailsResults[0];
                    const emailSubject = `Welcome to Your New Course: ${userDetails.course_title}!`;
                    const emailHtml = `
                        <p>Dear ${userDetails.firstname || userDetails.username || 'Learner'},</p>
                        <p>Welcome to your new course, <strong>${userDetails.course_title}</strong>!</p>
                        <p>You have successfully enrolled and can now start learning. We hope you enjoy the material!</p>
                        <p>Best regards,<br>The E-Learning Platform Team</p>
                    `;
                    sendEmail(userDetails.email, emailSubject, emailHtml);
                } else {
                    console.warn(`WARNING: Could not send enrollment email. User details or email not found for User ID: ${userId}`);
                }
            });

            // OPTIONAL: Increment enrollment_count in the courses table
            const updateCourseCountSql = 'UPDATE courses SET enrollment_count = IFNULL(enrollment_count, 0) + 1 WHERE id = ?';
            db.query(updateCourseCountSql, [moduleId], (updateErr) => {
                if (updateErr) {
                    console.error('ERROR: Failed to update enrollment count in courses table:', updateErr.stack);
                }
            });

            console.log('SUCCESS: Learner enrolled successfully. Enrollment ID:', insertResult.insertId);
            res.status(201).json({ message: 'Enrollment successful!', enrollmentId: insertResult.insertId });
        });
    });
});

// PUT: Update enrollment completion status with Email Notification
app.put('/enrollments/complete', (req, res) => {
    const { userId, moduleId, completionStatus, score, completionDate } = req.body;

    if (!userId || !moduleId || !completionStatus || score === undefined || !completionDate) {
        console.error('ERROR: Update Enrollment Completion - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: Missing required fields for updating completion status.' });
    }

    if (!['completed', 'failed', 'in_progress'].includes(completionStatus)) {
        console.error('ERROR: Update Enrollment Completion - Invalid completion status:', completionStatus);
        return res.status(400).json({ error: 'ERROR: Invalid completion status provided.' });
    }

    const parsedScore = parseFloat(score);
    if (isNaN(parsedScore)) {
        console.error('ERROR: Update Enrollment Completion - Score must be a number.');
        return res.status(400).json({ error: 'ERROR: Score must be a valid number.' });
    }

    const updateSql = 'UPDATE enrollments SET completion_status = ?, score = ?, completion_date = ? WHERE user_id = ? AND course_id = ?';
    const formattedCompletionDate = new Date(completionDate).toISOString().slice(0, 19).replace('T', ' '); // Format for MySQL DATETIME

    db.query(updateSql, [completionStatus, parsedScore, formattedCompletionDate, userId, moduleId], (err, result) => {
        if (err) {
            console.error('ERROR: Database error updating enrollment completion status:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update enrollment completion status.', details: err.message });
        }

        if (result.affectedRows === 0) {
            console.warn(`WARNING: Attempt to update non-existent enrollment (User ID: ${userId}, Module ID: ${moduleId}).`);
            return res.status(404).json({ message: 'ERROR: Enrollment record not found for update.' });
        }

        if (completionStatus === 'completed') { // Only send completion email if status is 'completed'
            const userCourseDetailsSql = `
                SELECT
                    r.email,
                    r.firstname,
                    r.lastname,
                    c.title AS course_title
                FROM registration r
                JOIN courses c ON c.id = ?
                WHERE r.id = ?;
            `;
            db.query(userCourseDetailsSql, [moduleId, userId], (detailsErr, detailsResults) => {
                if (detailsErr) {
                    console.error('ERROR: Database error fetching user/course details for completion email:', detailsErr.stack);
                } else if (detailsResults.length > 0 && detailsResults[0].email) {
                    const userDetails = detailsResults[0];
                    const emailSubject = `Course Completion & Certificate: ${userDetails.course_title}!`;
                    const emailHtml = `
                        <p>Dear ${userDetails.firstname || userDetails.username || 'Learner'},</p>
                        <p>Congratulations! You have successfully completed the course: <strong>${userDetails.course_title}</strong> with a score of ${parsedScore.toFixed(2)}%!</p>
                        <p>We are thrilled to see your progress.</p>
                        <p>You can now download your certificate directly from your Learner Dashboard.</p>
                        <p>Keep up the great work!</p>
                        <p>Best regards,<br>The E-Learning Platform Team</p>
                    `;
                    sendEmail(userDetails.email, emailSubject, emailHtml);
                } else {
                    console.warn(`WARNING: Could not send completion email. User details or email not found for User ID: ${userId}`);
                }
            });
        }

        console.log('SUCCESS: Enrollment completion status updated for User ID:', userId, 'Module ID:', moduleId);
        res.status(200).json({ message: 'SUCCESS: Enrollment completion status updated successfully!' });
    });
});

// --- Admin Module/Course Management Endpoints ---

// GET all courses (modules) with enrollment count
app.get('/admin/modules', (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.title,
            c.description,
            c.Credits,
            c.\`Lecturer ID\`,
            c.pages,
            c.is_published,
            COUNT(e.id) AS enrollment_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title, c.description, c.Credits, c.\`Lecturer ID\`, c.pages, c.is_published
        ORDER BY c.title;
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching modules for admin:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch modules from the database', details: err.message });
        }
        res.json(results);
    });
});

// POST a new course (module) - Admin
app.post('/admin/modules', (req, res) => {
    const { title, description, credits, lecturer_id, pages, is_published } = req.body;
    if (!title || credits === undefined || lecturer_id === undefined || pages === undefined || is_published === undefined) {
        console.error('ERROR: Admin Add Module - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All required fields (title, credits, lecturer_id, pages, is_published) are needed to add a module.' });
    }
    const sql = 'INSERT INTO courses (title, description, Credits, `Lecturer ID`, pages, is_published) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [title, description, credits, lecturer_id, pages, is_published], (err, result) => {
        if (err) {
            console.error('ERROR: Error adding module:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to add module to the database', details: err.message });
        }
        console.log('SUCCESS: Module added by admin. Insert ID:', result.insertId);
        res.status(201).json({ message: 'SUCCESS: Module added successfully', insertId: result.insertId });
    });
});

// PUT (update) an existing course (module) - Admin
app.put('/admin/modules/:id', (req, res) => {
    const courseId = req.params.id;
    const { title, description, credits, lecturer_id, pages, is_published } = req.body;
    if (!title || credits === undefined || lecturer_id === undefined || pages === undefined || is_published === undefined) {
        console.error('ERROR: Admin Update Module - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All required fields (title, credits, lecturer_id, pages, is_published) are needed to update a module.' });
    }
    const sql = 'UPDATE courses SET title = ?, description = ?, Credits = ?, `Lecturer ID` = ?, pages = ?, is_published = ? WHERE id = ?';
    db.query(sql, [title, description, credits, lecturer_id, pages, is_published, courseId], (err, result) => {
        if (err) {
            console.error('ERROR: Error updating module:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update module in the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Admin Update Module - Module not found for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Module not found' });
        }
        console.log('SUCCESS: Module updated by admin. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: Module updated successfully', affectedRows: result.affectedRows });
    });
});

// DELETE a course (module) - Admin
app.delete('/admin/modules/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'DELETE FROM courses WHERE id = ?';
    db.query(sql, [courseId], (err, result) => {
        if (err) {
            console.error('ERROR: Error deleting module:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to delete module from the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Admin Delete Module - Module not found for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Module not found.' });
        }
        console.log('SUCCESS: Module deleted by admin. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: Module deleted successfully', affectedRows: result.affectedRows });
    });
});

// Publish/Unpublish a module
app.put('/admin/modules/:id/publish', (req, res) => {
    const moduleId = req.params.id;
    const { is_published } = req.body; // Expect boolean true/false

    if (typeof is_published !== 'boolean') {
        console.error('ERROR: Publish/Unpublish - is_published must be a boolean value.');
        return res.status(400).json({ error: 'ERROR: is_published must be a boolean value.' });
    }

    const sql = 'UPDATE courses SET is_published = ? WHERE id = ?';
    db.query(sql, [is_published, moduleId], (err, result) => {
        if (err) {
            console.error(`ERROR: Error ${is_published ? 'publishing' : 'unpublishing'} module ${moduleId}:`, err.stack);
            return res.status(500).json({ error: `ERROR: Failed to ${is_published ? 'publish' : 'unpublish'} module.`, details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Publish/Unpublish - Module not found for ID:', moduleId);
            return res.status(404).json({ error: 'ERROR: Module not found.' });
        }
        console.log(`SUCCESS: Module ${moduleId} ${is_published ? 'published' : 'unpublished'} successfully.`);
        res.json({ message: `SUCCESS: Module ${is_published ? 'published' : 'unpublished'} successfully.` });
    });
});

// Assign instructor to a module
app.put('/admin/modules/:moduleId/assign-instructor', (req, res) => {
    const moduleId = req.params.moduleId;
    const { lecturer_id } = req.body;

    if (lecturer_id === undefined || lecturer_id === null) { // Check for undefined or null explicitly
        console.error('ERROR: Assign Instructor - Lecturer ID is required.');
        return res.status(400).json({ error: 'ERROR: Lecturer ID is required.' });
    }

    // Optional: Verify lecturer_id exists and has 'lecturer' role in 'registration' table
    const verifyLecturerSql = 'SELECT id FROM registration WHERE id = ? AND role = "lecturer"';
    db.query(verifyLecturerSql, [lecturer_id], (verifyErr, verifyResults) => {
        if (verifyErr) {
            console.error('ERROR: Database error verifying lecturer for assignment:', verifyErr.stack);
            return res.status(500).json({ error: 'ERROR: Database error during instructor assignment.' });
        }
        if (verifyResults.length === 0) {
            console.warn('WARNING: Assign Instructor - Invalid Lecturer ID or user is not a lecturer:', lecturer_id);
            return res.status(400).json({ error: 'ERROR: Invalid Lecturer ID or user is not a lecturer.' });
        }

        const assignSql = 'UPDATE courses SET `Lecturer ID` = ? WHERE id = ?';
        db.query(assignSql, [lecturer_id, moduleId], (assignErr, assignResult) => {
            if (assignErr) {
                console.error('ERROR: Error assigning instructor to module:', assignErr.stack);
                return res.status(500).json({ error: 'ERROR: Failed to assign instructor.', details: assignErr.message });
            }
            if (assignResult.affectedRows === 0) {
                console.warn('WARNING: Assign Instructor - Module not found for ID:', moduleId);
                return res.status(404).json({ error: 'ERROR: Module not found.' });
            }
            console.log('SUCCESS: Instructor assigned successfully for Module ID:', moduleId, 'Lecturer ID:', lecturer_id);
            res.json({ message: 'SUCCESS: Instructor assigned successfully.' });
        });
    });
});

// --- Admin User Management Endpoints ---

// GET all users
app.get('/admin/users', (req, res) => {
    // Do not expose password hashes to the frontend
    const sql = 'SELECT id, firstname, lastname, username, email, role, status FROM registration';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching users for admin:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch users from the database', details: err.message });
        }
        res.json(results);
    });
});

// Promote user to instructor role or change any role
app.put('/admin/users/:id/role', (req, res) => { // Changed endpoint name for clarity
    const userId = req.params.id;
    const { role } = req.body; // Expected to be 'lecturer', 'learner', 'admin'

    if (!['lecturer', 'learner', 'admin'].includes(role)) {
        console.error('ERROR: Update User Role - Invalid role provided:', role);
        return res.status(400).json({ error: 'ERROR: Invalid role provided.' }); // Completed this line
    }

    const sql = 'UPDATE registration SET role = ? WHERE id = ?';
    db.query(sql, [role, userId], (err, result) => {
        if (err) {
            console.error('ERROR: Error updating user role:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update user role.', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Update User Role - User not found for ID:', userId);
            return res.status(404).json({ error: 'ERROR: User not found.' });
        }
        console.log(`SUCCESS: User ID ${userId} role updated to: ${role}.`);
        res.json({ message: 'SUCCESS: User role updated successfully.', newRole: role });
    });
});

// PUT (update) a user's status (e.g., enable/disable) - Admin
app.put('/admin/users/:id/status', (req, res) => {
    const userId = req.params.id;
    const { status } = req.body; // Expected: 'active' or 'disabled'

    if (!['active', 'disabled'].includes(status)) {
        console.error('ERROR: Update User Status - Invalid status provided:', status);
        return res.status(400).json({ error: 'ERROR: Invalid status provided. Must be "active" or "disabled".' });
    }

    const sql = 'UPDATE registration SET status = ? WHERE id = ?';
    db.query(sql, [status, userId], (err, result) => {
        if (err) {
            console.error('ERROR: Error updating user status:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update user status.', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Update User Status - User not found for ID:', userId);
            return res.status(404).json({ error: 'ERROR: User not found.' });
        }
        console.log(`SUCCESS: User ID ${userId} status updated to: ${status}.`);
        res.json({ message: `SUCCESS: User status updated to ${status} successfully.`, newStatus: status });
    });
});

// DELETE a user - Admin (Use with caution!)
app.delete('/admin/users/:id', (req, res) => {
    const userId = req.params.id;
    // Consider also deleting related records in other tables (enrollments, learner_scores, etc.)
    // or setting up CASCADE DELETE in your database schema.
    const sql = 'DELETE FROM registration WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('ERROR: Error deleting user:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to delete user from the database.', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Delete User - User not found for ID:', userId);
            return res.status(404).json({ error: 'ERROR: User not found.' });
        }
        console.log(`SUCCESS: User ID ${userId} deleted.`);
        res.json({ message: 'SUCCESS: User deleted successfully.', affectedRows: result.affectedRows });
    });
});


// ============================
// SERVER START
// ============================
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access the server at http://localhost:${port}`);
});