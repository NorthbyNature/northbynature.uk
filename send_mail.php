<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and validate input data
    $name = htmlspecialchars(trim($_POST['name']));
    $email = htmlspecialchars(trim($_POST['email']));
    $subject = htmlspecialchars(trim($_POST['subject']));
    $message = htmlspecialchars(trim($_POST['message']));

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Invalid email address.";
        exit;
    }

    // Email details
    $to = 'info@northbynature.uk';
    $email_subject = "New Contact Form Submission: $subject";
    $email_body = "You have received a new message from $name ($email).\n\n".
                  "Message:\n$message";
    $headers = "From: $email\n";
    $headers .= "Reply-To: $email";

    // Send email
    if (mail($to, $email_subject, $email_body, $headers)) {
        echo "Message sent successfully!";
    } else {
        echo "There was a problem sending your message. Please try again.";
    }
} else {
    echo "Invalid request.";
}
?>
