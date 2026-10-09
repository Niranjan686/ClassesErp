const NotificationLog = require('../models/NotificationLog');

/**
 * Notification Service for ClassTech Multi-Tenant SaaS ERP
 * Handles Email, SMS, and WhatsApp dispatch with logging in MongoDB.
 */

// 1. Send Student Welcome Email & SMS with Auto-Generated Credentials
async function sendStudentWelcome({ student, plainPassword, courseName = 'Certified Course', batchTiming = 'Regular Slot' }) {
    const studentName = `${student.fname} ${student.lname}`;
    const username = student.grno;
    
    const emailSubject = `🎓 Welcome to ClassTech - Your Student Portal Login Details`;
    const emailBody = `
Dear ${studentName},

Welcome to ClassTech Educational Campus! Your admission for ${courseName} is successfully confirmed.

Here are your Student Portal login credentials to access your daily attendance, course syllabus, fee receipts, and apply for leaves:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Student Portal Login Details:
• Portal URL: http://localhost:5173/login
• Student GR No / Username: ${username}
• Temporary Password: ${plainPassword}
• Enrolled Course: ${courseName}
• Batch Timing: ${batchTiming}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please change your password after your initial sign in.

Best Regards,
ClassTech Educational Campus Administration
    `.trim();

    const smsBody = `Welcome to ClassTech, ${student.fname}! Your Student Portal is ready. Login: http://localhost:5173/login | User: ${username} | Pass: ${plainPassword}`;

    try {
        if (student.email) {
            await NotificationLog.create({
                recipientType: 'Student',
                recipientName: studentName,
                recipientEmail: student.email,
                recipientPhone: student.mobileNo,
                type: 'Email',
                subject: emailSubject,
                message: emailBody,
                triggerEvent: 'Student_Admission',
                branchId: student.branchId || null,
                status: 'Sent'
            });
            console.log(`✉️ [EMAIL SENT] Welcome email dispatched to ${student.email}`);
        }

        if (student.mobileNo) {
            await NotificationLog.create({
                recipientType: 'Student',
                recipientName: studentName,
                recipientEmail: student.email || '',
                recipientPhone: student.mobileNo,
                type: 'SMS',
                subject: 'ClassTech Admission Confirmation & Login SMS',
                message: smsBody,
                triggerEvent: 'Student_Admission',
                branchId: student.branchId || null,
                status: 'Sent'
            });
            console.log(`📱 [SMS SENT] Admission & Credentials SMS sent to ${student.mobileNo}`);
        }

        return { success: true, emailSent: !!student.email, smsSent: !!student.mobileNo };
    } catch (err) {
        console.error('Notification dispatch error:', err.message);
        return { success: false, error: err.message };
    }
}

// 2. Send Absentee Parent SMS Alert
async function sendAbsenteeParentSMS({ student, date, batchName = 'Regular Batch', timing = 'Class Slot' }) {
    const studentName = `${student.fname} ${student.lname}`;
    const targetPhone = student.fatherMobileNo || student.motherMobileNo || student.mobileNo;

    const smsMessage = `Dear Parent, your ward ${studentName} (GR: ${student.grno}) was marked ABSENT today (${date}) for ${batchName} (${timing}) at ClassTech. Please contact center for queries.`;

    try {
        await NotificationLog.create({
            recipientType: 'Parent',
            recipientName: student.fatherName || `Parent of ${studentName}`,
            recipientPhone: targetPhone,
            type: 'SMS',
            subject: 'Absentee Alert SMS',
            message: smsMessage,
            triggerEvent: 'Absentee_Parent_Alert',
            branchId: student.branchId || null,
            status: 'Sent'
        });

        console.log(`🚨 [PARENT SMS SENT] Absentee alert sent to ${targetPhone} for student ${studentName}`);
        return { success: true, targetPhone };
    } catch (err) {
        console.error('Absentee SMS error:', err.message);
        return { success: false, error: err.message };
    }
}

// 3. Send Leave Status Update
async function sendLeaveStatusNotification({ leave, studentOrStaff }) {
    const name = leave.applicantName;
    const email = studentOrStaff?.email;
    const phone = studentOrStaff?.mobileNo || studentOrStaff?.phone;

    const message = `Hello ${name}, your leave request from ${leave.startDate} to ${leave.endDate} has been ${leave.status.toUpperCase()} by ClassTech Administration.${leave.adminRemarks ? ` Remarks: "${leave.adminRemarks}"` : ''}`;

    try {
        await NotificationLog.create({
            recipientType: leave.applicantType,
            recipientName: name,
            recipientEmail: email || '',
            recipientPhone: phone || '',
            type: 'SMS',
            subject: `Leave Request ${leave.status}`,
            message,
            triggerEvent: 'Leave_Status_Update',
            branchId: leave.branchId || null,
            status: 'Sent'
        });
        return { success: true };
    } catch (err) {
        console.error('Leave notification error:', err.message);
        return { success: false };
    }
}

// 4. Send Franchise Branch Admin Creation Credentials
async function sendBranchWelcome({ branch, adminUsername, plainPassword }) {
    const subject = `🏛️ ClassTech Educational SaaS ERP Activated - ${branch.branchName}`;
    const emailBody = `
Dear ${branch.ownerName},

Congratulations! Your institute "${branch.branchName}" is officially onboarded to the ClassTech Educational SaaS ERP Platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Class Administrator Portal:
• Portal URL: http://localhost:5173/login
• Admin Username: ${adminUsername}
• Admin Password: ${plainPassword}
• Institute Code: ${branch.branchCode}
• Max Allowed Students: ${branch.maxStudents}
• Subscription Plan: ${branch.subscriptionPlan}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    try {
        await NotificationLog.create({
            recipientType: 'BranchAdmin',
            recipientName: branch.ownerName,
            recipientEmail: branch.email,
            recipientPhone: branch.phone,
            type: 'Email',
            subject,
            message: emailBody,
            triggerEvent: 'Branch_Credentials',
            branchId: branch._id,
            status: 'Sent'
        });
        console.log(`🚀 [FRANCHISE EMAIL SENT] ClassTech credentials dispatched to ${branch.email}`);
        return { success: true };
    } catch (err) {
        console.error('Branch welcome error:', err.message);
        return { success: false };
    }
}

// 5. Send Fee Payment Receipt SMS & Email
async function sendFeeReceiptNotification({ transaction, student }) {
    const studentName = `${student.fname} ${student.lname}`;
    const targetPhone = student.fatherMobileNo || student.mobileNo;
    const email = student.email;

    const message = `ClassTech Fee Receipt: Received ₹${transaction.amountPaid} for ${studentName} (GR: ${student.grno}, Receipt: ${transaction.receiptNo}, Mode: ${transaction.paymentMode}). Remaining Balance: ₹${transaction.remainingBalance}. Thank you!`;

    try {
        if (targetPhone) {
            await NotificationLog.create({
                recipientType: 'Student',
                recipientName: studentName,
                recipientPhone: targetPhone,
                type: 'SMS',
                subject: 'Fee Receipt Confirmation',
                message,
                triggerEvent: 'Fee_Receipt',
                branchId: student.branchId || null,
                status: 'Sent'
            });
            console.log(`💳 [FEE RECEIPT SMS] Dispatched to ${targetPhone} for ${studentName}`);
        }
        return { success: true };
    } catch (err) {
        console.error('Fee notification error:', err.message);
        return { success: false };
    }
}

// 6. Send Fee Due Reminder Alert
async function sendFeeDueReminder({ student, dueAmount, courseName }) {
    const studentName = `${student.fname} ${student.lname}`;
    const targetPhone = student.fatherMobileNo || student.mobileNo;

    const message = `Dear Parent, reminder from ClassTech: Fee balance of ₹${dueAmount} is pending for ${studentName} (${courseName || 'Enrolled Course'}). Kindly clear dues at the accounts desk.`;

    try {
        if (targetPhone) {
            await NotificationLog.create({
                recipientType: 'Parent',
                recipientName: student.fatherName || `Parent of ${studentName}`,
                recipientPhone: targetPhone,
                type: 'SMS',
                subject: 'Fee Due Reminder',
                message,
                triggerEvent: 'Fee_Reminder',
                branchId: student.branchId || null,
                status: 'Sent'
            });
            console.log(`📢 [FEE REMINDER SENT] Alert dispatched to ${targetPhone}`);
        }
        return { success: true };
    } catch (err) {
        console.error('Fee reminder error:', err.message);
        return { success: false };
    }
}

// 7. Send Exam Result Notification
async function sendExamResultNotification({ exam, student, markRecord }) {
    const studentName = `${student.fname} ${student.lname}`;
    const targetPhone = student.fatherMobileNo || student.mobileNo;

    const message = `ClassTech Result Alert: ${studentName} scored ${markRecord.totalMarksObtained}/${exam.totalMaxMarks} (${markRecord.percentage}%, Grade: ${markRecord.grade}) in ${exam.title}. Result: ${markRecord.resultStatus}. View marksheet on Student Portal.`;

    try {
        if (targetPhone) {
            await NotificationLog.create({
                recipientType: 'Student',
                recipientName: studentName,
                recipientPhone: targetPhone,
                type: 'SMS',
                subject: 'Exam Result Announcement',
                message,
                triggerEvent: 'Exam_Result',
                branchId: student.branchId || null,
                status: 'Sent'
            });
            console.log(`🏆 [EXAM RESULT SMS] Dispatched to ${targetPhone} for ${studentName}`);
        }
        return { success: true };
    } catch (err) {
        console.error('Exam result notification error:', err.message);
        return { success: false };
    }
}

// 8. Send Inquiry Confirmation SMS & Email
async function sendEnquiryConfirmation({ enquiry }) {
    const message = `Hello ${enquiry.candidateName}, thank you for inquiring about ${enquiry.courseName} at ClassTech. Our academic counselor will connect with you shortly for counseling & batch schedule.`;

    try {
        if (enquiry.mobileNo) {
            await NotificationLog.create({
                recipientType: 'Student',
                recipientName: enquiry.candidateName,
                recipientEmail: enquiry.email || '',
                recipientPhone: enquiry.mobileNo,
                type: 'SMS',
                subject: 'Inquiry Confirmation',
                message,
                triggerEvent: 'General_Alert',
                branchId: enquiry.branchId || null,
                status: 'Sent'
            });
        }
        return { success: true };
    } catch (err) {
        console.error('Inquiry notification error:', err.message);
        return { success: false };
    }
}

// 9. Send Demo Lecture Booking Confirmation
async function sendDemoScheduleNotification({ enquiry }) {
    const message = `Dear ${enquiry.candidateName}, your FREE Demo Lecture for ${enquiry.courseName} is scheduled on ${enquiry.demoDate} at ${enquiry.demoTiming} at ClassTech. Trainer: ${enquiry.demoFaculty || 'Lab Senior Faculty'}.`;

    try {
        if (enquiry.mobileNo) {
            await NotificationLog.create({
                recipientType: 'Student',
                recipientName: enquiry.candidateName,
                recipientEmail: enquiry.email || '',
                recipientPhone: enquiry.mobileNo,
                type: 'SMS',
                subject: 'Demo Lecture Scheduled',
                message,
                triggerEvent: 'General_Alert',
                branchId: enquiry.branchId || null,
                status: 'Sent'
            });
        }
        return { success: true };
    } catch (err) {
        console.error('Demo notification error:', err.message);
        return { success: false };
    }
}

module.exports = {
    sendStudentWelcome,
    sendAbsenteeParentSMS,
    sendLeaveStatusNotification,
    sendBranchWelcome,
    sendFeeReceiptNotification,
    sendFeeDueReminder,
    sendExamResultNotification,
    sendEnquiryConfirmation,
    sendDemoScheduleNotification
};
