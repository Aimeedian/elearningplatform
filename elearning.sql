-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2025 at 01:42 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elearning`
--

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

CREATE TABLE `assessments` (
  `assessment_id` int(11) NOT NULL,
  `assessment_title` varchar(255) NOT NULL,
  `assessment_type` enum('Quiz','Exam','Assignment','Project','Other') NOT NULL,
  `associated_course_id` int(11) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `passing_score_percent` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `title` char(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `Credits` int(5) NOT NULL,
  `Lecturer ID` int(5) NOT NULL,
  `pages` int(11) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `enrollment_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `description`, `Credits`, `Lecturer ID`, `pages`, `is_published`, `enrollment_count`) VALUES
(5, 'IT', 'MODULE SLIDES', 20, 6, 45, 0, 0),
(8, 'maintainance', 'computer maintainance', 30, 1, 34, 0, 0),
(10, 'Database technology', 'This module is designed to help the student gain ...', 10, 2, 20, 0, 0),
(12, 'dfghjjuytres', 'fdsdfghjklncxcghyzxdsfdghfjyktiyrhgnefvdcsx', 5, 2, 123, 1, 0),
(13, 'bvcvb', 'vcxcvb', 89, 5, 12, 0, 0),
(14, 'nm', 'zxcvgbhjklkjuhytd', 34, 1, 12, 0, 0),
(15, 'bgfds', 'bfds', 12, 2, 12, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrollment_date` datetime DEFAULT current_timestamp(),
  `completion_status` varchar(20) DEFAULT 'in_progress',
  `completion_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registration`
--

CREATE TABLE `registration` (
  `id` int(11) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration`
--

INSERT INTO `registration` (`id`, `firstname`, `lastname`, `username`, `email`, `password`, `role`, `status`) VALUES
(27, 'Phocas', 'NTIRENGANYA', 'Niphocas', 'niphocas@gmail.com', '$2b$10$6FT.Ej6kCa83ZO0ScldXeevCJPCtS4XR3UU/FXe0agSvSEPYYbdRC', 'lecturer', 'active'),
(29, 'eugene', 'nbvf', 'eugene', 'Ngg@gmail.com', '$2b$10$fny/K/zLW5hT1s/lPy7KaOqC4C0JFI9eavbDeyXea2nGTNHtN12yC', 'lecturer', 'active'),
(30, 'aimee', 'diane', 'aimee', 'ku@gmail.com', '$2b$10$i2pOeysv3a9ErnuivgLtAOGY3IB.BawIBWYkeIp3X4BDAGavGUPq6', 'administrator', 'active'),
(31, 'xavier', 'muganga', 'xavier', 'bb@gmail.com', '$2b$10$rUf5HiUyMpU6zVgNmeiRseCs831foh.vyG9zVsUbpY6c2Dj.JILiu', 'learner', 'active'),
(32, 'aline', 'ineza', 'aline', 'aline@gmail.com', '$2b$10$N2hgaURc8q3ELNzxgKF7bemdrHpyz45jzi.BAwQnpx/1H1tpc3GN2', 'lecturer', 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`assessment_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`course_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `assessment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `registration`
--
ALTER TABLE `registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `registration` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
