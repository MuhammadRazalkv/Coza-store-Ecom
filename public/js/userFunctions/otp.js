document.addEventListener("DOMContentLoaded", function () {
    const timerElement = document.getElementById("timer");
    const resendMessageElement = document.getElementById("resend-message");
    const submitBtn = document.getElementById("submit-btn");

    const TIMER_KEY = "otp_expiry_time";
    const timerDuration = 60; // seconds
    let timer;

    function getRemainingTime() {
        const expiry = localStorage.getItem(TIMER_KEY);
        if (!expiry) return 0;

        const remaining = Math.floor((parseInt(expiry) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
    }

    function startTimer(seconds) {
        let timeRemaining = seconds;

        timer = setInterval(() => {
            if (timeRemaining <= 0) {
                clearInterval(timer);
                timerElement.textContent = "OTP expired!";
                resendMessageElement.style.display = "block";
                localStorage.removeItem(TIMER_KEY);
                return;
            }

            const minutes = Math.floor(timeRemaining / 60);
            const secs = String(timeRemaining % 60).padStart(2, "0");

            timerElement.textContent = `Time remaining: ${minutes}:${secs}`;
            timeRemaining--;
        }, 1000);
    }

    function initTimer() {
        let remaining = getRemainingTime();

        // If no existing timer → create new expiry
        if (remaining === 0) {
            const expiryTime = Date.now() + timerDuration * 1000;
            localStorage.setItem(TIMER_KEY, expiryTime);
            remaining = timerDuration;
        }

        startTimer(remaining);
    }

    function resetTimer() {
        clearInterval(timer);
        const expiryTime = Date.now() + timerDuration * 1000;
        localStorage.setItem(TIMER_KEY, expiryTime);
        resendMessageElement.style.display = "none";
        startTimer(timerDuration);
    }

    // Initialize on page load
    initTimer();

    // Reset timer when OTP submitted or resent
    // submitBtn.addEventListener("click", resetTimer);
});

 