-- Database Schema for HR Evaluation System
CREATE DATABASE IF NOT EXISTS hr_evaluation_pro;
USE hr_evaluation_pro;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `internal_id` varchar(50) NOT NULL,
  `member_id` varchar(20) DEFAULT NULL,
  `org_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `dept` varchar(255) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `salary_group` varchar(50) DEFAULT NULL,
  `role` enum('COMMITTEE','MANAGER','ASST','HEAD','STAFF') NOT NULL DEFAULT 'STAFF',
  `parent_internal_id` varchar(50) DEFAULT NULL,
  `img` varchar(255) DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `can_view_report` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL, -- For future auth
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_internal_id` (`internal_id`),
  KEY `idx_parent` (`parent_internal_id`),
  KEY `idx_org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for criteria
-- ----------------------------
DROP TABLE IF EXISTS `criteria`;
CREATE TABLE `criteria` (
  `id` varchar(20) NOT NULL,
  `text` text NOT NULL,
  `category` varchar(20) NOT NULL, -- PERF, CHAR, EXEC, etc.
  `weight` int(11) NOT NULL DEFAULT 0,
  `description` text,
  `role_group` varchar(50) DEFAULT NULL, -- To easily filter which roles use this (e.g. STAFF, HEAD)
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for evaluations
-- ----------------------------
DROP TABLE IF EXISTS `evaluations`;
CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluator_internal_id` varchar(50) NOT NULL,
  `target_internal_id` varchar(50) NOT NULL,
  `criteria_id` varchar(20) NOT NULL,
  `score` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_score` (`evaluator_internal_id`,`target_internal_id`,`criteria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluator_internal_id` varchar(50) NOT NULL,
  `target_internal_id` varchar(50) NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_comment` (`evaluator_internal_id`,`target_internal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for exclusions
-- ----------------------------
DROP TABLE IF EXISTS `exclusions`;
CREATE TABLE `exclusions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluator_org_id` int(11) NOT NULL,
  `target_org_id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for system_config
-- ----------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `key` varchar(50) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for logs
-- ----------------------------
DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(50) DEFAULT NULL,
  `message` text,
  `user_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Initial Data: System Config
-- ----------------------------
INSERT INTO `system_config` (`key`, `value`) VALUES
('start_date', '2025-01-01'),
('end_date', '2025-12-31'),
('send_email_copy', 'false'),
('smtp_host', ''),
('smtp_port', '587'),
('smtp_user', ''),
('smtp_pass', ''),
('smtp_encryption', 'tls');

-- ----------------------------
-- Initial Data: Criteria
-- ----------------------------
-- Performance
INSERT INTO `criteria` (`id`, `text`, `category`, `weight`, `description`) VALUES
('1.1', 'ปริมาณผลงาน (Quantity)', 'PERF', 20, 'พิจารณาจากจำนวนปริมาณงานที่ปฏิบัติได้เทียบกับเป้าหมาย หรือภาระงานที่ได้รับมอบหมายในความรับผิดชอบ'),
('1.2', 'คุณภาพผลงาน (Quality)', 'PERF', 20, 'ความถูกต้องแม่นยำของงาน ความเป็นระเบียบเรียบร้อย ความคุ้มค่า และการลดความสูญเสีย/ข้อผิดพลาด'),
('1.3', 'ความทันเวลา (Timeliness)', 'PERF', 20, 'ความสามารถในการปฏิบัติงานให้เสร็จตามกำหนดเวลาที่นัดหมาย หรือทันต่อความต้องการใช้งานของสมาชิก'),
('1.4', 'ผลสัมฤทธิ์ของงาน (Achievement)', 'PERF', 20, 'พิจารณาจากผลงานที่ส่งผลต่อความสำเร็จของส่วนงานหรือเป้าหมายหลักของสหกรณ์ฯ ในภาพรวม'),
('1.5', 'ความรับผิดชอบ (Responsibility)', 'PERF', 20, 'ความทุ่มเท ความขยันหมั่นเพียร และความรับผิดชอบต่อหน้าที่ที่ได้รับมอบหมายจนสำเร็จลุล่วง');

-- Characteristics (Officer)
INSERT INTO `criteria` (`id`, `text`, `category`, `weight`, `description`) VALUES
('2.1', 'ความสามารถในการปฏิบัติงาน', 'CHAR', 20, 'ความรู้ความเข้าใจในระเบียบ ข้อบังคับ และขั้นตอนการปฏิบัติงานในหน้าที่ของตนเอง'),
('2.2', 'การแก้ไขปัญหาสถานการณ์เฉพาะหน้า', 'CHAR', 20, 'ความสามารถในการตัดสินใจแก้ไขปัญหาที่เกิดขึ้นอย่างกะทันหันได้อย่างถูกต้องและเหมาะสม'),
('2.3', 'การเรียนรู้และพัฒนาปรับปรุงงาน', 'CHAR', 20, 'ความกระตือรือร้นในการศึกษาความรู้ใหม่ๆ และนำมาปรับปรุงกระบวนการทำงานให้ดีขึ้น'),
('2.4', 'ความคิดริเริ่มสร้างสรรค์', 'CHAR', 10, 'การเสนอแนะแนวคิดใหม่ๆ หรือวิธีทำงานรูปแบบใหม่ที่เป็นประโยชน์ต่อส่วนงาน'),
('2.5', 'การรักษาวินัย/มารยาท', 'CHAR', 10, 'การปฏิบัติตามระเบียบวินัย การแต่งกาย การมาทำงานตรงเวลา และกิริยามารยาทต่อเพื่อนร่วมงาน'),
('2.6', 'การให้ความร่วมมือ/ประสานงาน', 'CHAR', 10, 'การทำงานร่วมกับผู้อื่นได้อย่างราบรื่น การช่วยเหลือเพื่อนร่วมงาน และการประสานงานข้ามส่วนงาน'),
('2.7', 'มนุษยสัมพันธ์/ทัศนคติที่ดีต่อองค์กร', 'CHAR', 10, 'การมีทัศนคติเชิงบวกต่อสหกรณ์ฯ การแสดงออกที่เป็นมิตร และความจงรักภักดีต่อองค์กร'),
('2.8', 'การมีส่วนร่วมในกิจกรรมสหกรณ์', 'CHAR', 10, 'การเข้าร่วมกิจกรรมที่สหกรณ์ฯ จัดขึ้น เช่น งานสวัสดิการ งานอาสา หรือกิจกรรมสัมพันธ์ต่างๆ'),
('2.9', 'การให้บริการด้วยจิตบริการ (Service Mind)', 'CHAR', 10, 'ความเต็มใจในการให้บริการสมาชิกด้วยความยิ้มแย้ม แจ่มใส และความสุภาพเรียบร้อย');

-- Characteristics (Executive)
INSERT INTO `criteria` (`id`, `text`, `category`, `weight`, `description`) VALUES
('2.1-E', 'การกำหนดทิศทางและเป้าหมาย', 'EXEC', 20, 'ความสามารถในการวางแผนงาน กำหนดทิศทาง และเป้าหมายระยะสั้น-ยาว ให้แก่ส่วนงาน'),
('2.2-E', 'ทักษะในการสื่อสารจูงใจ', 'EXEC', 20, 'ความสามารถในการถ่ายทอดคำสั่ง นโยบาย และสร้างแรงจูงใจให้ผู้ใต้บังคับบัญชาปฏิบัติงานอย่างเต็มใจ'),
('2.3-E', 'ความคิดริเริ่มสร้างสรรค์เชิงรุก', 'EXEC', 20, 'การมองหาโอกาสในการพัฒนาธุรกิจหรือบริการใหม่ๆ เพื่อความยั่งยืนของสหกรณ์ฯ'),
('2.4-E', 'ความสามารถในการตัดสินใจ', 'EXEC', 20, 'ความกล้าหาญและรอบคอบในการตัดสินใจในเรื่องสำคัญๆ โดยคำนึงถึงประโยชน์สูงสุดของส่วนรวม'),
('2.5-E', 'ทักษะในการฟังและรับความคิดเห็น', 'EXEC', 10, 'การเปิดใจรับฟังความคิดเห็นจากผู้ใต้บังคับบัญชาและนำมาปรับปรุงแก้ไขการทำงาน'),
('2.6-E', 'ความสามารถในการแก้ปัญหาความขัดแย้ง', 'EXEC', 20, 'ความยุติธรรมและการจัดการปัญหาความขัดแย้งภายในกลุ่มงานได้อย่างมีประสิทธิภาพ'),
('2.7-E', 'การมอบหมายและติดตามงาน', 'EXEC', 20, 'การเลือกคนที่เหมาะสมกับงาน (Put the right man on the right job) และการติดตามผลอย่างต่อเนื่อง'),
('2.8-E', 'การเป็นผู้สนับสนุนและสร้างทีมงาน', 'EXEC', 10, 'การสนับสนุนเครื่องมือและทรัพยากร รวมถึงการสร้างบรรยากาศการทำงานที่ดีเป็นทีม'),
('2.9-E', 'การเรียนรู้และพัฒนาตนเองอย่างต่อเนื่อง', 'EXEC', 10, 'การเป็นแบบอย่างที่ดีในการศึกษาหาความรู้และพัฒนาศักยภาพผู้บริหารอยู่เสมอ'),
('2.10-E', 'การเป็นผู้สอนงาน (Coaching)', 'EXEC', 10, 'ความสามารถในการสอนงานและถ่ายทอดประสบการณ์เพื่อพัฒนาขีดความสามารถของลูกน้อง'),
('2.11-E', 'การแก้ปัญหาสถานการณ์เฉพาะหน้า', 'EXEC', 20, 'ภาวะผู้นำในการแก้ไขวิกฤตหรือปัญหาที่ซับซ้อนภายใต้แรงกดดัน'),
('2.12-E', 'การมีส่วนร่วมในกิจกรรมสหกรณ์', 'EXEC', 10, 'การเป็นผู้นำในการเข้าร่วมกิจกรรมของสหกรณ์ฯ และงานสังคมส่วนรวม'),
('2.13-E', 'การให้บริการด้วยจิตบริการ (Service Mind)', 'EXEC', 10, 'ความแสดงภาพลักษณ์ที่ดีในการให้บริการ และการสนับสนุนวัฒนธรรมการบริการในส่วนงาน');

-- ----------------------------
-- Initial Data: Exclusions
-- ----------------------------
INSERT INTO `exclusions` (`evaluator_org_id`, `target_org_id`, `reason`) VALUES
(53, 22, 'ปฐมพงศ์ ไม่ต้องประเมิน พรชนัน'),
(58, 16, 'ณัฐชยา ข้าม ชวาลา'),
(8, 16, 'ธมนวรรณ ข้าม ชวาลา'),
(37, 17, 'ธมลวรรณ ข้าม อรพรรณ'),
(63, 17, 'วรินทร์ธร ข้าม อรพรรณ'),
(60, 17, 'ธนาเทพ ข้าม อรพรรณ'),
(41, 17, 'พงษ์ศักดิ์ ข้าม อรพรรณ'),
(22, 53, 'พรชนัน ข้าม ปฐมพงศ์'),
(16, 58, 'ชวาลา ข้าม ณัฐชยา'),
(16, 8, 'ชวาลา ข้าม ธมนวรรณ'),
(17, 49, 'อรพรรณ ข้าม สุชญา'),
(17, 19, 'อรพรรณ ข้าม เกียรติณรงค์'),
(17, 23, 'อรพรรณ ข้าม ณัฏฐเวช');

-- ----------------------------
-- Initial Data: Users (Hierarchical)
-- ----------------------------
-- Note: In a real migration, we would insert these sequentially to ensure parent keys exist, 
-- or disable foreign keys temporarily (which we did at the top).
-- IDs are mapped from MOCK_DATA. Internal IDs will be generated or mapped.
-- Here we use explicit INSERTs for the provided MOCK_DATA structure.

-- Root: Chairman
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_999', 999, 'ท่านประธาน', 'คณะกรรมการบริหาร', 'คณะกรรมการ', NULL, 'ไม่จัดกลุ่ม', 'COMMITTEE', NULL);

-- Manager
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`, `can_view_report`) VALUES
('U_21', 21, 'ปิยธิดา แย้มเกษร', 'ผู้จัดการ', 'ผู้จัดการ', 120000, 'เกิน 100,000', 'MANAGER', 'U_999', 1);

-- Children of Manager
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`, `can_view_report`) VALUES
('U_26', 26, 'ธัญญ์ศริน วราชุน', 'หัวหน้าบัญชี', 'บัญชี', 48000, 'เกิน 40,000', 'HEAD', 'U_21', 0),
('U_23', 23, 'ณัฏฐเวช เศรษฐศิโรตม์', 'ผู้ช่วยการเงิน', 'การเงินและลงทุน', 85000, 'เกิน 50,000', 'ASST', 'U_21', 0),
('U_19', 19, 'เกียรติณรงค์ ถนอมทรัพย์', 'ผู้ช่วยไอที', 'ไอที', 90000, 'เกิน 50,000', 'ASST', 'U_21', 1), -- can_view_report
('U_13', 13, 'อุราพร พิมพ์ทอง', 'รองผู้จัดการ', 'รองผู้จัดการ', 95000, 'เกิน 50,000', 'ASST', 'U_21', 0);

-- Update admin status for Managers and Assistants explicitly if schema allows defaults
-- Since schema default is 0, we need to set it.
-- BUT User 19 is inserted above with can_view_report=1.
-- Schema does not have is_admin in that list.
-- We must fix the Table Insert or add an UPDATE statement at the end.

-- Children of U_26 (Account Head)
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_47', 47, 'ขวัญฤทัย จิตรบำรุง', 'เจ้าหน้าที่', 'บัญชี', 28000, 'เกิน 20,000', 'STAFF', 'U_26'),
('U_57', 57, 'พุทธวรรณ จิตตประกอบ', 'เจ้าหน้าที่', 'บัญชี', 18000, 'ไม่เกิน 20,000', 'STAFF', 'U_26');

-- Children of U_23 (Finance Asst)
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_53', 53, 'ปฐมพงศ์ ใจช่วย', 'เจ้าหน้าที่', 'การเงินและลงทุน', 35000, 'เกิน 30,000', 'STAFF', 'U_23');

-- Section Head under Finance (U_23) -> Using U_23 as parent equivalent for section structure logic flattening
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_22', 22, 'พรชนัน สมบูรณ์สวัสดิ์', 'หัวหน้า', 'การเงินและลงทุน', 45000, 'เกิน 40,000', 'HEAD', 'U_23');

-- Children of U_22
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_59', 59, 'จิราพร ศรีวิชัย', 'เจ้าหน้าที่', 'การเงินและลงทุน', 19000, 'ไม่เกิน 20,000', 'STAFF', 'U_22'),
('U_65', 65, 'ณฏฐณิชา อ่อนบาง', 'เจ้าหน้าที่', 'การเงินและลงทุน', 19500, 'ไม่เกิน 20,000', 'STAFF', 'U_22'),
('U_51', 51, 'ณิชชา ไชยะกาล', 'เจ้าหน้าที่', 'การเงินและลงทุน', 25000, 'เกิน 20,000', 'STAFF', 'U_22'),
('U_25', 25, 'วรพร ปั้นรัตน์', 'เจ้าหน้าที่', 'การเงินและลงทุน', 38000, 'เกิน 30,000', 'STAFF', 'U_22'),
('U_46', 46, 'นาย สุรัตน์ ขุนทอง', 'จนท 3 ฝ่าย การเงิน', 'การเงินและลงทุน', 26770, 'เกิน 20,000', 'STAFF', 'U_22');

-- Children of U_19 (IT Asst) -> Section Head
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`, `is_admin`) VALUES
('U_29', 29, 'สมัย เสริฐเจิม', 'หัวหน้า', 'ไอที', 85000, 'เกิน 50,000', 'HEAD', 'U_19', 1);

-- Children of U_29
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`, `is_admin`) VALUES
('U_62', 62, 'กัณหา งิ้วออก', 'เจ้าหน้าที่', 'ไอที', 29000, 'เกิน 20,000', 'STAFF', 'U_29', 1),
('U_48', 48, 'ตุลภัทร จัตุสุนทรกุล', 'เจ้าหน้าที่', 'ไอที', 39000, 'เกิน 30,000', 'STAFF', 'U_29', 0);

-- Children of U_13 (Vice Manager)
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_11', 11, 'ธัญญา ศักดิ์กะทัศน์', 'ผู้ช่วยผู้จัดการ', 'สินเชื่อและกำแพงแสน', 88000, 'เกิน 50,000', 'ASST', 'U_13'),
('U_49', 49, 'สุชญา อรุณินทร์', 'ผู้ช่วยผู้จัดการ', 'บริหารทั่วไป', 82000, 'เกิน 50,000', 'ASST', 'U_13');

-- Children of U_11 (Credit Asst)
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_17', 17, 'อรพรรณ โสภณธนะสิริ', 'หัวหน้า', 'สินเชื่อและกำแพงแสน', 49000, 'เกิน 40,000', 'HEAD', 'U_11'),
('U_16', 16, 'ชวาลา บุญจันทร์', 'หัวหน้า', 'สินเชื่อและกำแพงแสน', 75000, 'เกิน 50,000', 'HEAD', 'U_11');

-- Children of U_16
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_37', 37, 'ธมลวรรณ นาคสกุล', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', 39000, 'เกิน 30,000', 'STAFF', 'U_16'),
('U_63', 63, 'วรินทร์ธร เพิ่มศิริคณาชัย', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', 16000, 'ไม่เกิน 20,000', 'STAFF', 'U_16'),
('U_60', 60, 'ธนาเทพ พุทธา', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', 17000, 'ไม่เกิน 20,000', 'STAFF', 'U_16'),
('U_41', 41, 'พงษ์ศักดิ์ สิทธิภาพ', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', 33000, 'เกิน 30,000', 'STAFF', 'U_16');

-- Children of U_17
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_58', 58, 'ณัฐชยา ทินกูล', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', 15000, 'ไม่เกิน 20,000', 'STAFF', 'U_17'),
('U_8', 8, 'ธมนวรรณ แสงจันทร์', 'เจ้าหน้าที่', 'สินเชื่อและกำแพงแสน', 60000, 'เกิน 50,000', 'STAFF', 'U_17');

-- Children of U_49 (Admin Asst)
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_14', 14, 'สดใส ศรีเจริญสุข', 'หัวหน้า', 'บริหารทั่วไป', 78000, 'เกิน 50,000', 'HEAD', 'U_49');

-- Children of U_14
INSERT INTO `users` (`internal_id`, `org_id`, `name`, `position`, `dept`, `salary`, `salary_group`, `role`, `parent_internal_id`) VALUES
('U_18', 18, 'สุภาพร วงษ์สกุล', 'เจ้าหน้าที่', 'บริหารทั่วไป', 41000, 'เกิน 40,000', 'STAFF', 'U_14'),
('U_56', 56, 'ชนิกานต์ จีระสมบัติ', 'เจ้าหน้าที่', 'บริหารทั่วไป', 12000, 'ไม่เกิน 20,000', 'STAFF', 'U_14'),
('U_64', 64, 'ณัชชา ล้อมวงค์', 'เจ้าหน้าที่', 'บริหารทั่วไป', 13000, 'ไม่เกิน 20,000', 'STAFF', 'U_14'),
('U_31', 31, 'พรพิมล เสาะด้น', 'เจ้าหน้าที่', 'บริหารทั่วไป', 31000, 'เกิน 30,000', 'STAFF', 'U_14'),
('U_61', 61, 'พัทรดา วาณิชย์ราบรื่น', 'เจ้าหน้าที่', 'บริหารทั่วไป', 14000, 'ไม่เกิน 20,000', 'STAFF', 'U_14'),
('U_38', 38, 'วชิราพร ไชยพงศ์', 'เจ้าหน้าที่', 'บริหารทั่วไป', 34000, 'เกิน 30,000', 'STAFF', 'U_14'),
('U_32', 32, 'ศศิภา เพชรกรรพุม', 'เจ้าหน้าที่', 'บริหารทั่วไป', 36000, 'เกิน 30,000', 'STAFF', 'U_14'),
('U_50', 50, 'พรภิชัย ทะวงศ์', 'เจ้าหน้าที่', 'บริหารทั่วไป', 24000, 'เกิน 20,000', 'STAFF', 'U_14');



-- ----------------------------
-- Final Fixes: Ensure specific users are Admins
-- ----------------------------
UPDATE `users` SET `is_admin` = 1 WHERE `org_id` IN (19, 21);

SET FOREIGN_KEY_CHECKS = 1;
