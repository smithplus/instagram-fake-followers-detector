# Instagram Fake Followers Detector

> 🔗 **Direct Access:** [https://smithplus.github.io/instagram-fake-followers-detector/](https://smithplus.github.io/instagram-fake-followers-detector/)

> ⚠️ **Note:** This project is an enhanced fork of [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) created by [@davidarroyo1234](https://github.com/davidarroyo1234).

## 📝 About
A powerful tool designed to detect and analyze potentially fake followers on Instagram profiles. This enhanced version provides detailed insights into follower authenticity, helping users identify suspicious accounts and maintain genuine engagement on their Instagram profiles.

## ✨ Features
- Automatic detection of suspicious accounts
- Intuitive and user-friendly interface
- Customizable detection parameters
- CSV export functionality
- Pause and resume analysis capability
- Real-time progress tracking
- Detailed analytics and reporting

## 📋 Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Instagram access
- Instagram login in your browser (required for Instagram API access)
- JavaScript enabled in your browser

## 🚀 Usage Instructions

### 1. Preparation
1. Make sure you're logged into Instagram in your browser
2. Navigate to the Instagram profile you want to analyze

### 2. Open Browser Console
There are several ways to open the browser console:

**Method 1 - Keyboard shortcuts:**
- Windows/Linux: `Ctrl + Shift + J` (Chrome) or `Ctrl + Shift + K` (Firefox)
- Mac: `Cmd + Option + J` (Chrome) or `Cmd + Option + K` (Firefox)

**Method 2 - Browser menu:**
- Chrome: 
  1. Click the three dots (⋮) in the top-right corner
  2. Go to "More tools" > "Developer tools"
  3. Select the "Console" tab
- Firefox:
  1. Click the menu (☰) in the top-right corner
  2. Go to "More tools" > "Developer tools"
  3. Select the "Console" tab

### 3. Run the Detector
1. Go to [https://smithplus.github.io/instagram-fake-followers-detector/](https://smithplus.github.io/instagram-fake-followers-detector/)
2. Click the "Copy code" button
3. Return to the Instagram tab
4. Paste the code into the browser console
5. Press Enter to run the detector

### 4. Analysis
- The detector will begin analyzing the profile's followers
- You'll see a progress bar in the console
- You can pause the analysis at any time
- Results will be displayed in the console and can be exported to CSV

### 5. Results
- Detected suspicious accounts
- Detailed statistics
- CSV export option
- Analysis-based recommendations

## ⚙️ Configuration
You can adjust the detection parameters in the console before running the analysis:

```javascript
const config = {
    followersFollowingRatio: 2.0,    // Followers/following ratio
    minPostsPerMonth: 2,            // Minimum posts per month
    minEngagementRate: 0.01,        // Minimum engagement rate
    minAccountAge: 30,              // Minimum account age in days
    requireProfilePic: true,        // Require profile picture
    requireBio: true,               // Require biography
    batchSize: 50                   // Analysis batch size
};
```

## 🔒 Privacy and Security
- No personal information is stored
- Analysis is performed locally in your browser
- No Instagram account access required
- No information is shared with third parties

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions are welcome. Please open an issue first to discuss the changes you would like to make.

## ⚠️ Legal Disclaimer
This tool is for educational and research purposes only. We are not responsible for any misuse of this tool. 