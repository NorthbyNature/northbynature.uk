<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars(trim($_POST['name']));
    $email = htmlspecialchars(trim($_POST['email']));
    $subject = htmlspecialchars(trim($_POST['subject']));
    $message = htmlspecialchars(trim($_POST['message']));

    $to = 'info@northbynature.uk';
    $email_subject = "New Contact Form Submission: $subject";
    $email_body = "You have received a new message from the user $name.\n".
                  "Here is the message:\n$message";
    $headers = "From: $email\n";
    $headers .= "Reply-To: $email";

    if (mail($to, $email_subject, $email_body, $headers)) {
        echo "Message sent successfully!";
    } else {
        echo "There was a problem sending your message. Please try again.";
    }
}
?>