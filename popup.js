// Popup script for motivational quotes
class MotivationalPopup {
  constructor() {
    this.quotes = [
      "Code is like humor. When you have to explain it, it's bad. 😄",
      "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
      "Life is like programming: if it doesn't work, just add more coffee! ☕",
      "Remember: Every expert was once a beginner who refused to give up! 💪",
      "Debugging is like being a detective in a crime movie where you're also the murderer. 🕵️",
      "The best error message is the one that never shows up. Keep coding! 🚀",
      "Your code works? Ship it before it changes its mind! 📦",
      "A day without laughter is a day wasted. A day without coding... is also wasted! 😂",
      "99 little bugs in the code, 99 bugs in the code. Take one down, patch it around, 127 bugs in the code! 🐛➡️🐛🐛🐛",
      "If at first you don't succeed, call it version 1.0! 🎯",
    ];
    this.currentQuoteIndex = 0;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.showRandomQuote();
  }

  setupEventListeners() {
    const newQuoteBtn = document.getElementById("new-quote-btn");
    if (newQuoteBtn) {
      newQuoteBtn.addEventListener("click", () => this.showRandomQuote());
    }
  }

  showRandomQuote() {
    const quoteElement = document.getElementById("motivational-quote");
    if (!quoteElement) return;

    // Get a random quote different from the current one
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.quotes.length);
    } while (newIndex === this.currentQuoteIndex && this.quotes.length > 1);

    this.currentQuoteIndex = newIndex;
    const selectedQuote = this.quotes[this.currentQuoteIndex];

    // Add fade out effect
    quoteElement.style.opacity = "0";

    setTimeout(() => {
      quoteElement.textContent = selectedQuote;
      quoteElement.style.opacity = "1";
    }, 150);
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new MotivationalPopup();
});
