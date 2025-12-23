-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 23, 2025 at 01:06 PM
-- Server version: 10.5.4-MariaDB
-- PHP Version: 8.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hr_evaluation_pro`
--

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `evaluator_internal_id` varchar(50) NOT NULL,
  `target_internal_id` varchar(50) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `criteria`
--

CREATE TABLE `criteria` (
  `id` varchar(20) NOT NULL,
  `text` text NOT NULL,
  `category` varchar(20) NOT NULL,
  `weight` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `role_group` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `criteria`
--

INSERT INTO `criteria` (`id`, `text`, `category`, `weight`, `description`, `role_group`) VALUES
('1.1', 'ปริมาณผลงาน (Quantity)', 'PERF', 20, 'พิจารณาจากจำนวนปริมาณงานที่ปฏิบัติได้เทียบกับเป้าหมาย หรือภาระงานที่ได้รับมอบหมายในความรับผิดชอบ', NULL),
('1.2', 'คุณภาพผลงาน (Quality)', 'PERF', 20, 'ความถูกต้องแม่นยำของงาน ความเป็นระเบียบเรียบร้อย ความคุ้มค่า และการลดความสูญเสีย/ข้อผิดพลาด', NULL),
('1.3', 'ความทันเวลา (Timeliness)', 'PERF', 20, 'ความสามารถในการปฏิบัติงานให้เสร็จตามกำหนดเวลาที่นัดหมาย หรือทันต่อความต้องการใช้งานของสมาชิก', NULL),
('1.4', 'ผลสัมฤทธิ์ของงาน (Achievement)', 'PERF', 20, 'พิจารณาจากผลงานที่ส่งผลต่อความสำเร็จของส่วนงานหรือเป้าหมายหลักของสหกรณ์ฯ ในภาพรวม', NULL),
('1.5', 'ความรับผิดชอบ (Responsibility)', 'PERF', 20, 'ความทุ่มเท ความขยันหมั่นเพียร และความรับผิดชอบต่อหน้าที่ที่ได้รับมอบหมายจนสำเร็จลุล่วง', NULL),
('2.1', 'ความสามารถในการปฏิบัติงาน', 'CHAR', 20, 'ความรู้ความเข้าใจในระเบียบ ข้อบังคับ และขั้นตอนการปฏิบัติงานในหน้าที่ของตนเอง', NULL),
('2.1-E', 'การกำหนดทิศทางและเป้าหมาย', 'EXEC', 20, 'ความสามารถในการวางแผนงาน กำหนดทิศทาง และเป้าหมายระยะสั้น-ยาว ให้แก่ส่วนงาน', NULL),
('2.10-E', 'การเป็นผู้สอนงาน (Coaching)', 'EXEC', 10, 'ความสามารถในการสอนงานและถ่ายทอดประสบการณ์เพื่อพัฒนาขีดความสามารถของลูกน้อง', NULL),
('2.11-E', 'การแก้ปัญหาสถานการณ์เฉพาะหน้า', 'EXEC', 20, 'ภาวะผู้นำในการแก้ไขวิกฤตหรือปัญหาที่ซับซ้อนภายใต้แรงกดดัน', NULL),
('2.12-E', 'การมีส่วนร่วมในกิจกรรมสหกรณ์', 'EXEC', 10, 'การเป็นผู้นำในการเข้าร่วมกิจกรรมของสหกรณ์ฯ และงานสังคมส่วนรวม', NULL),
('2.13-E', 'การให้บริการด้วยจิตบริการ (Service Mind)', 'EXEC', 10, 'ความแสดงภาพลักษณ์ที่ดีในการให้บริการ และการสนับสนุนวัฒนธรรมการบริการในส่วนงาน', NULL),
('2.2', 'การแก้ไขปัญหาสถานการณ์เฉพาะหน้า', 'CHAR', 20, 'ความสามารถในการตัดสินใจแก้ไขปัญหาที่เกิดขึ้นอย่างกะทันหันได้อย่างถูกต้องและเหมาะสม', NULL),
('2.2-E', 'ทักษะในการสื่อสารจูงใจ', 'EXEC', 20, 'ความสามารถในการถ่ายทอดคำสั่ง นโยบาย และสร้างแรงจูงใจให้ผู้ใต้บังคับบัญชาปฏิบัติงานอย่างเต็มใจ', NULL),
('2.3', 'การเรียนรู้และพัฒนาปรับปรุงงาน', 'CHAR', 20, 'ความกระตือรือร้นในการศึกษาความรู้ใหม่ๆ และนำมาปรับปรุงกระบวนการทำงานให้ดีขึ้น', NULL),
('2.3-E', 'ความคิดริเริ่มสร้างสรรค์เชิงรุก', 'EXEC', 20, 'การมองหาโอกาสในการพัฒนาธุรกิจหรือบริการใหม่ๆ เพื่อความยั่งยืนของสหกรณ์ฯ', NULL),
('2.4', 'ความคิดริเริ่มสร้างสรรค์', 'CHAR', 10, 'การเสนอแนะแนวคิดใหม่ๆ หรือวิธีทำงานรูปแบบใหม่ที่เป็นประโยชน์ต่อส่วนงาน', NULL),
('2.4-E', 'ความสามารถในการตัดสินใจ', 'EXEC', 20, 'ความกล้าหาญและรอบคอบในการตัดสินใจในเรื่องสำคัญๆ โดยคำนึงถึงประโยชน์สูงสุดของส่วนรวม', NULL),
('2.5', 'การรักษาวินัย/มารยาท', 'CHAR', 10, 'การปฏิบัติตามระเบียบวินัย การแต่งกาย การมาทำงานตรงเวลา และกิริยามารยาทต่อเพื่อนร่วมงาน', NULL),
('2.5-E', 'ทักษะในการฟังและรับความคิดเห็น', 'EXEC', 10, 'การเปิดใจรับฟังความคิดเห็นจากผู้ใต้บังคับบัญชาและนำมาปรับปรุงแก้ไขการทำงาน', NULL),
('2.6', 'การให้ความร่วมมือ/ประสานงาน', 'CHAR', 10, 'การทำงานร่วมกับผู้อื่นได้อย่างราบรื่น การช่วยเหลือเพื่อนร่วมงาน และการประสานงานข้ามส่วนงาน', NULL),
('2.6-E', 'ความสามารถในการแก้ปัญหาความขัดแย้ง', 'EXEC', 20, 'ความยุติธรรมและการจัดการปัญหาความขัดแย้งภายในกลุ่มงานได้อย่างมีประสิทธิภาพ', NULL),
('2.7', 'มนุษยสัมพันธ์/ทัศนคติที่ดีต่อองค์กร', 'CHAR', 10, 'การมีทัศนคติเชิงบวกต่อสหกรณ์ฯ การแสดงออกที่เป็นมิตร และความจงรักภักดีต่อองค์กร', NULL),
('2.7-E', 'การมอบหมายและติดตามงาน', 'EXEC', 20, 'การเลือกคนที่เหมาะสมกับงาน (Put the right man on the right job) และการติดตามผลอย่างต่อเนื่อง', NULL),
('2.8', 'การมีส่วนร่วมในกิจกรรมสหกรณ์', 'CHAR', 10, 'การเข้าร่วมกิจกรรมที่สหกรณ์ฯ จัดขึ้น เช่น งานสวัสดิการ งานอาสา หรือกิจกรรมสัมพันธ์ต่างๆ', NULL),
('2.8-E', 'การเป็นผู้สนับสนุนและสร้างทีมงาน', 'EXEC', 10, 'การสนับสนุนเครื่องมือและทรัพยากร รวมถึงการสร้างบรรยากาศการทำงานที่ดีเป็นทีม', NULL),
('2.9', 'การให้บริการด้วยจิตบริการ (Service Mind)', 'CHAR', 10, 'ความเต็มใจในการให้บริการสมาชิกด้วยความยิ้มแย้ม แจ่มใส และความสุภาพเรียบร้อย', NULL),
('2.9-E', 'การเรียนรู้และพัฒนาตนเองอย่างต่อเนื่อง', 'EXEC', 10, 'การเป็นแบบอย่างที่ดีในการศึกษาหาความรู้และพัฒนาศักยภาพผู้บริหารอยู่เสมอ', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `evaluator_internal_id` varchar(50) NOT NULL,
  `target_internal_id` varchar(50) NOT NULL,
  `criteria_id` varchar(20) NOT NULL,
  `score` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `exclusions`
--

CREATE TABLE `exclusions` (
  `id` int(11) NOT NULL,
  `evaluator_org_id` int(11) NOT NULL,
  `target_org_id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `exclusions`
--

INSERT INTO `exclusions` (`id`, `evaluator_org_id`, `target_org_id`, `reason`) VALUES
(1, 53, 22, 'ปฐมพงศ์ ไม่ต้องประเมิน พรชนัน'),
(2, 58, 16, 'ณัฐชยา ข้าม ชวาลา'),
(3, 8, 16, 'ธมนวรรณ ข้าม ชวาลา'),
(4, 37, 17, 'ธมลวรรณ ข้าม อรพรรณ'),
(5, 63, 17, 'วรินทร์ธร ข้าม อรพรรณ'),
(6, 60, 17, 'ธนาเทพ ข้าม อรพรรณ'),
(7, 41, 17, 'พงษ์ศักดิ์ ข้าม อรพรรณ'),
(8, 22, 53, 'พรชนัน ข้าม ปฐมพงศ์'),
(9, 16, 58, 'ชวาลา ข้าม ณัฐชยา'),
(10, 16, 8, 'ชวาลา ข้าม ธมนวรรณ'),
(11, 17, 49, 'อรพรรณ ข้าม สุชญา'),
(12, 17, 19, 'อรพรรณ ข้าม เกียรติณรงค์'),
(13, 17, 23, 'อรพรรณ ข้าม ณัฏฐเวช');

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  `type` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `system_config`
--

CREATE TABLE `system_config` (
  `key` varchar(50) NOT NULL,
  `value` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `system_config`
--

INSERT INTO `system_config` (`key`, `value`) VALUES
('', ''),
('dept_adjustments', '{\"บัญชี\":1,\"การเงินและลงทุน\":1,\"ไอที\":1,\"สินเชื่อและกำแพงแสน\":1,\"บริหารทั่วไป\":1,\"รองผู้จัดการ\":1,\"ผู้จัดการ\":1,\"คณะกรรมการ\":1}'),
('end_date', '2025-12-31'),
('send_email_copy', 'true'),
('smtp_encryption', 'ssl'),
('smtp_host', 'smtp.gmail.com'),
('smtp_pass', 'fofq hkpl uqgm bvfc'),
('smtp_port', '465'),
('smtp_user', 'kiatnarong.t@ku.th'),
('start_date', '2025-01-20');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `internal_id` varchar(50) NOT NULL,
  `member_id` varchar(20) DEFAULT NULL,
  `org_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `dept` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `salary_group` varchar(50) DEFAULT NULL,
  `role` enum('COMMITTEE','MANAGER','ASST','HEAD','STAFF') NOT NULL DEFAULT 'STAFF',
  `parent_internal_id` varchar(50) DEFAULT NULL,
  `img` varchar(255) DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `can_view_report` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `password` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `internal_id`, `member_id`, `org_id`, `name`, `position`, `dept`, `mobile`, `salary`, `salary_group`, `role`, `parent_internal_id`, `img`, `is_admin`, `can_view_report`, `is_active`, `password`, `email`) VALUES
(2, 'U_21', '010146', 21, 'ปิยธิดา แย้มเกษร', 'ผู้จัดการ', 'ผู้จัดการ', '0859632097', 120000.00, 'เกิน 100,000', 'MANAGER', 'U_999', NULL, 0, 1, 1, NULL, 'ypiyatida@gmail.com'),
(3, 'U_26', '012189', 26, 'ธัญญ์ศริน วราชุน', 'หัวหน้าบัญชี', 'บัญชี', '0863592354', 48000.00, 'เกิน 40,000', 'HEAD', 'U_21', NULL, 0, 0, 1, NULL, 'aimjung.hihi@gmail.com'),
(4, 'U_23', '010999', 23, 'ณัฏฐเวช เศรษฐศิโรตม์', 'ผู้ช่วยการเงิน', 'การเงินและลงทุน', '0818356712', 85000.00, 'เกิน 50,000', 'ASST', 'U_21', NULL, 0, 0, 1, NULL, 'nut444@hotmail.com'),
(5, 'U_19', '009999', 19, 'เกียรติณรงค์ ถนอมทรัพย์', 'ผู้ช่วยไอที', 'ไอที', '0816676397', 90000.00, 'เกิน 50,000', 'ASST', 'U_21', NULL, 1, 1, 1, NULL, 'kiatnarong.t@ku.th'),
(6, 'U_13', '008725', 13, 'อุราพร พิมพ์ทอง', 'รองผู้จัดการ', 'รองผู้จัดการ', '0896877042', 95000.00, 'เกิน 50,000', 'ASST', 'U_21', NULL, 0, 0, 1, NULL, 'tunuraporn@gmail.com'),
(7, 'U_47', '016559', 47, 'ขวัญฤทัย จิตรบำรุง', 'เจ้าหน้าที่', 'บัญชี', '0917954492', 28000.00, 'เกิน 20,000', 'STAFF', 'U_26', NULL, 0, 0, 1, NULL, 'khuwrathai6950@gmail.com'),
(8, 'U_57', '018169', 57, 'พุทธวรรณ จิตตประกอบ', 'เจ้าหน้าที่', 'บัญชี', '0800753921', 18000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_26', NULL, 0, 0, 1, NULL, 'teemjittaprackob@gmail.com'),
(9, 'U_53', '017371', 53, 'ปฐมพงศ์ ใจช่วย', 'เจ้าหน้าที่', 'การเงินและลงทุน', '0814112202', 35000.00, 'เกิน 30,000', 'STAFF', 'U_23', NULL, 0, 0, 1, NULL, 'patompong.jaichuai@gmail.com'),
(10, 'U_22', '010818', 22, 'พรชนัน สมบูรณ์สวัสดิ์', 'หัวหน้า', 'การเงินและลงทุน', '0805451454', 45000.00, 'เกิน 40,000', 'HEAD', 'U_23', NULL, 0, 0, 1, NULL, 'tuckiezz@gmail.com'),
(11, 'U_59', '017675', 59, 'จิราพร ศรีวิชัย', 'เจ้าหน้าที่', 'การเงินและลงทุน', '0649589895', 19000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_22', NULL, 0, 0, 1, NULL, 'cikcapu0212@gmail.com'),
(12, 'U_65', '018728', 65, 'ณฏฐณิชา อ่อนบาง', 'เจ้าหน้าที่', 'การเงินและลงทุน', '0982599036', 19500.00, 'ไม่เกิน 20,000', 'STAFF', 'U_22', NULL, 0, 0, 1, NULL, 'nattanicha.ob@gmail.com'),
(13, 'U_51', '016953', 51, 'ณิชชา ไชยะกาล', 'เจ้าหน้าที่', 'การเงินและลงทุน', '0969822258', 25000.00, 'เกิน 20,000', 'STAFF', 'U_22', NULL, 0, 0, 1, NULL, 'nutz_siwan23@hotmail.com'),
(14, 'U_25', '012188', 25, 'วรพร ปั้นรัตน์', 'เจ้าหน้าที่', 'การเงินและลงทุน', '0949635663', 38000.00, 'เกิน 30,000', 'STAFF', 'U_22', NULL, 0, 0, 1, NULL, 'vorapornpunrat@gmail.com'),
(15, 'U_29', '012938', 29, 'สมัย เสริฐเจิม', 'หัวหน้า', 'ไอที', '0812681022', 85000.00, 'เกิน 50,000', 'HEAD', 'U_19', 'https://apps2.coop.ku.ac.th/asset/staff/2568/crop/012938.jpg', 1, 1, 1, NULL, NULL),
(16, 'U_62', '018555', 62, 'กัณหา งิ้วออก', 'เจ้าหน้าที่', 'ไอที', '0949364515', 29000.00, 'เกิน 20,000', 'STAFF', 'U_29', 'https://apps2.coop.ku.ac.th/asset/staff/2568/crop/018555.jpg', 1, 1, 1, NULL, NULL),
(17, 'U_48', '016789', 48, 'ตุลภัทร จัตุสุนทรกุล', 'เจ้าหน้าที่', 'ไอที', '0944832465', 39000.00, 'เกิน 30,000', 'STAFF', 'U_29', NULL, 0, 0, 1, NULL, 'tullapat.ch@kuscc.com'),
(18, 'U_11', '008723', 11, 'ธัญญา ศักดิ์กะทัศน์', 'ผู้ช่วยผู้จัดการ', 'สินเชื่อและกำแพงแสน', '0867823920', 88000.00, 'เกิน 50,000', 'ASST', 'U_13', NULL, 0, 0, 1, NULL, 'thanya.sakkatas@gmail.com'),
(19, 'U_49', '016887', 49, 'สุชญา อรุณินทร์', 'ผู้ช่วยผู้จัดการ', 'บริหารทั่วไป', '0896636955', 82000.00, 'เกิน 50,000', 'ASST', 'U_13', NULL, 0, 0, 1, NULL, 'suchaya2020@gmail.com'),
(20, 'U_17', '009720', 17, 'อรพรรณ โสภณธนะสิริ', 'หัวหน้า', 'สินเชื่อและกำแพงแสน', '0895149691', 49000.00, 'เกิน 40,000', 'HEAD', 'U_11', NULL, 0, 0, 1, NULL, 'apple2509@gmail.com'),
(21, 'U_16', '009719', 16, 'ชวาลา บุญจันทร์', 'หัวหน้า', 'สินเชื่อและกำแพงแสน', '0992354559', 75000.00, 'เกิน 50,000', 'HEAD', 'U_11', NULL, 0, 0, 1, NULL, 'chaomini2917@gmail.com'),
(22, 'U_37', '014916', 37, 'ธมลวรรณ นาคสกุล', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', '0813550456', 39000.00, 'เกิน 30,000', 'STAFF', 'U_16', NULL, 0, 0, 1, NULL, 'thamonwannaksakul@gmail.com'),
(23, 'U_63', '018608', 63, 'วรินทร์ธร เพิ่มศิริคณาชัย', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', '0947872442', 16000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_16', NULL, 0, 0, 1, NULL, 'warinthorn.pe@gmail.com'),
(24, 'U_60', '018472', 60, 'ธนาเทพ พุทธา', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', '0659835586', 17000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_16', NULL, 0, 0, 1, NULL, 'thanatep.phutta@gmail.com'),
(25, 'U_41', '015457', 41, 'พงษ์ศักดิ์ สิทธิภาพ', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', '0628782888', 33000.00, 'เกิน 30,000', 'STAFF', 'U_16', NULL, 0, 0, 1, NULL, 'bannong504@gmail.com'),
(26, 'U_58', '018468', 58, 'ณัฐชยา ทินกูล', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', '0853462391', 15000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_17', NULL, 0, 0, 1, NULL, 'on.jean@hotmail.com'),
(27, 'U_8', '008085', 8, 'ธมนวรรณ แสงจันทร์', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', '0896157451', 60000.00, 'เกิน 50,000', 'STAFF', 'U_17', NULL, 0, 0, 1, NULL, 'puy7451puy@gmail.com'),
(28, 'U_14', '008846', 14, 'สดใส ศรีเจริญสุข', 'หัวหน้า', 'บริหารทั่วไป', '0851383211', 78000.00, 'เกิน 50,000', 'HEAD', 'U_49', NULL, 0, 0, 1, NULL, 'sricharoensuk@gmail.com'),
(29, 'U_18', '009988', 18, 'สุภาพร วงษ์สกุล', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0891457173', 41000.00, 'เกิน 40,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'jvongsakul@gmail.com'),
(30, 'U_56', '018100', 56, 'ชนิกานต์ จีระสมบัติ', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0959516708', 12000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'chanikanmint0641@gmail.com'),
(31, 'U_64', '018600', 64, 'ณัชชา ล้อมวงค์', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0944982020', 13000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'nnatcha.lomwong@gmail.com'),
(32, 'U_31', '013666', 31, 'พรพิมล เสาะด้น', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0873580746', 31000.00, 'เกิน 30,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'psoadon@gmail.com'),
(33, 'U_61', '018484', 61, 'พัทรดา วาณิชย์ราบรื่น', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0859109538', 14000.00, 'ไม่เกิน 20,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'wanitrabruen.24@gmail.com'),
(34, 'U_38', '015151', 38, 'วชิราพร ไชยพงศ์', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0833404908', 34000.00, 'เกิน 30,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'miw.wc42@gmail.com'),
(35, 'U_32', '010933', 32, 'ศศิภา เพชรกรรพุม', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0892007899', 36000.00, 'เกิน 30,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'bsasipa@gmail.com'),
(36, 'U_50', '016999', 50, 'พรภิชัย ทะวงศ์', 'เจ้าหน้าที่', 'บริหารทั่วไป', '0993210816', 24000.00, 'เกิน 20,000', 'STAFF', 'U_14', NULL, 0, 0, 1, NULL, 'sansanlaw9999@gmail.com'),
(37, 'U_46', '016558', 46, 'สุรัตน์ ขุนทอง', 'เจ้าหน้าที่', 'การเงินและลงทุน', '0827774208', 26770.00, 'เกิน 20,000', 'STAFF', 'U_22', NULL, 0, 0, 1, NULL, 'yodchuffing15@gmail.com'),
(55, 'U_902', '000986', 902, 'ชาญชัย ไล้เลิศ', 'กรรมการ', 'คณะกรรมการ', '0847572425', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'cclailert@gmail.com'),
(56, 'U_903', '006910', 903, 'ดำรงค์ ศรีพระราม', 'กรรมการ', 'คณะกรรมการ', '0817503971', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'ffordrs@ku.ac.th'),
(57, 'U_904', '002210', 904, 'ทวีวัฒน์ ทัศนวัฒน์', 'กรรมการ', 'คณะกรรมการ', '0851170792', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'fvettht@gmail.com'),
(58, 'U_905', '003488', 905, 'ธวัชชัย ศักดิ์ภู่อร่าม', 'กรรมการ', 'คณะกรรมการ', '0890563032', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'fvetths@ku.ac.th'),
(59, 'U_907', '004442', 907, 'นิพนธ์ ลิ้มแหลมทอง', 'กรรมการ', 'คณะกรรมการ', '0819185926', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'lekniphonn@gmail.com'),
(60, 'U_908', '002279', 908, 'บพิธ จารุพันธุ์', 'กรรมการ', 'คณะกรรมการ', '0819103320', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'ubjp@ku.ac.th'),
(61, 'U_909', '004561', 909, 'พงศ์พันธ์ เหลืองวิไล', 'กรรมการ', 'คณะกรรมการ', '0986539922', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'kpsppl@ku.ac.th'),
(62, 'U_910', '006451', 910, 'พูนทรัพย์ บุญรำพรรณ', 'กรรมการ', 'คณะกรรมการ', '0891890047', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'ijspsb@gmail.com'),
(63, 'U_911', '001983', 911, 'ภัคพร วงษ์สิงห์', 'กรรมการ', 'คณะกรรมการ', '0818256452', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'pakkaporn1950@gmail.com'),
(64, 'U_913', '006390', 913, 'รังสรรค์ ปิติปัญญา', 'กรรมการ', 'คณะกรรมการ', '0819882205', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'rangsanpitipunya@gmail.com'),
(65, 'U_915', '001247', 915, 'วิเชียร ไล้เลิศ', 'กรรมการ', 'คณะกรรมการ', '0994169598', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'wichian78900@gmail.com'),
(66, 'U_916', '001430', 916, 'วิวัฒน์ แดงสุภา', 'กรรมการ', 'คณะกรรมการ', '0814582040', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'fsciwwd@ku.ac.th'),
(67, 'U_918', '002818', 918, 'สรัญญา โชติพัฒน์', 'กรรมการ', 'คณะกรรมการ', '0891285234', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'sara-9101@windowslive.com'),
(68, 'U_919', '004393', 919, 'สหัส ภัทรฐิตินันท์', 'กรรมการ', 'คณะกรรมการ', '0896745443', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'regshp@ku.ac.th'),
(69, 'U_920', '007607', 920, 'สุวาพร ชื่นอารมณ์', 'กรรมการ', 'คณะกรรมการ', '0817011685', 0.00, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL, NULL, 0, 0, 1, NULL, 'suwaporn977@gmail.com');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_comment` (`evaluator_internal_id`,`target_internal_id`);

--
-- Indexes for table `criteria`
--
ALTER TABLE `criteria`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_score` (`evaluator_internal_id`,`target_internal_id`,`criteria_id`);

--
-- Indexes for table `exclusions`
--
ALTER TABLE `exclusions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_config`
--
ALTER TABLE `system_config`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_internal_id` (`internal_id`),
  ADD KEY `idx_parent` (`parent_internal_id`),
  ADD KEY `idx_org_id` (`org_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exclusions`
--
ALTER TABLE `exclusions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
