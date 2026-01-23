# Personal Productivity Assistant 🚀

A modern, health-focused Chrome extension that transforms your new tab into a comprehensive productivity dashboard. Stay organized, healthy, and motivated with real-time information, smart reminders, and customizable shortcuts.

## ✨ Features

### 🕒 Real-Time Dashboard

- **Animated Clock**: Beautiful, smooth updating time display with millisecond precision
- **Local Time Zone**: Automatic detection and display of your local time
- **Date Information**: Current date with elegant formatting

### 📊 Year Progress Tracker

- **Days Remaining**: Real-time countdown of days left in the current year
- **Progress Percentage**: Visual representation of year completion
- **Motivational Context**: Helps maintain perspective on time and goals

### 🏃‍♂️ Health & Wellness Reminders

- **Smart Break Timer**: Configurable reminders (default: every 45 minutes)
- **Health Tips**: Rotating wellness advice and tips
- **Break Management**: "I'm Back" button to reset timers after breaks
- **Promotes Healthy Habits**: Encourages regular movement, hydration, and rest

### 🔗 Customizable Shortcuts

- **Quick Access**: Fast navigation to frequently used websites
- **Import/Export**: Backup and restore your shortcuts
- **Visual Management**: Easy-to-use interface for organizing links
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+I` to import shortcuts
  - `Ctrl+Shift+E` to export shortcuts

### 💡 Daily Motivation

- **Motivational Quotes**: Inspiring messages in the popup
- **Refresh on Demand**: Get new quotes whenever you need inspiration
- **Personalized Greetings**: Time-appropriate welcomes (Good morning, afternoon, evening)

### 🎨 Modern Design

- **Animated Background**: Subtle floating elements for visual appeal
- **Responsive Layout**: Adapts to different screen sizes
- **Clean Interface**: Minimalist design focused on productivity
- **Smooth Animations**: Enhanced user experience with fluid transitions

## 🚀 Installation

### From Chrome Web Store

_Coming soon - extension will be published to Chrome Web Store_

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will replace your new tab page immediately

## 🛠️ Usage

### Setting Up Health Reminders

1. The health reminder starts automatically when you open a new tab
2. Default reminder interval is 45 minutes
3. When it's time for a break, you'll see the reminder prominently displayed
4. Click "I'm Back" when you return from your break

### Managing Shortcuts

1. **Import Shortcuts**: Click the import button or use `Ctrl+Shift+I`
2. **Export Shortcuts**: Click the export button or use `Ctrl+Shift+E`
3. **Add Custom Links**: Use the shortcuts interface to add your frequently visited sites

### Getting Daily Motivation

1. Click the extension icon in your browser toolbar
2. Read your daily motivational quote
3. Click "New Quote" for fresh inspiration

## 🔧 Configuration

The extension stores all settings locally using Chrome's storage API:

- Health reminder intervals
- Custom shortcuts
- User preferences
- Timer states

## 🧪 Testing 1-Minute Timer

If you want to test a **1-minute** timer (to see if you like it better or for debugging):

1. Open `background.js`.
2. Change `45` to `1` in these **6 specific lines**:
   - Lines: 8, 91, 127, 161, 229, 260.
3. Reload the extension.
4. Test it! If you like it, keep using it.

## 📱 Compatibility

- **Chrome**: Version 88 and above
- **Edge**: Chromium-based versions
- **Brave**: Compatible with Chrome extensions
- **Other Chromium Browsers**: Should work with most Chromium-based browsers

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/rohitdeshmukh27/StandUp.exe-Chrome-Extensions.git
cd StandUp.exe-Chrome-Extensions
# Load the extension in Chrome developer mode`

## ?? Roadmap

- [ ] Weather widget integration
- [ ] Task/todo list management
- [ ] Pomodoro timer integration
- [ ] Habit tracking
- [ ] Calendar integration
- [ ] Dark/light theme toggle
- [ ] Custom reminder sounds
- [ ] Export data to various formats

## ?? Bug Reports & Feature Requests

Found a bug or have a feature idea? Please [open an issue](https://github.com/rohitdeshmukh27/StandUp.exe-Chrome-Extensions/issues) with:
- Clear description of the issue/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Browser version and OS

## ?? License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ?? Acknowledgments

- Icons provided by various icon libraries
- Inspired by productivity methodologies and wellness practices
- Built with modern web technologies for optimal performance

## ?? Version History

### v1.0.0
- Initial release
- Real-time dashboard with animated clock
- Health reminder system
- Customizable shortcuts
- Daily motivation popup
- Year progress tracker

---

**Stay productive, stay healthy! ??**

*If you find this extension helpful, please consider giving it a ? star on GitHub!*
```
