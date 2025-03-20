// Instagram Fake Followers Detector
// Run this code in the browser console while on an Instagram profile

(() => {
    // Verify we're on Instagram and on a profile
    if (location.hostname !== 'www.instagram.com') {
        alert('This tool can only be used on Instagram');
        return;
    }

    // Get username from current URL
    const getCurrentUsername = () => {
        const path = window.location.pathname;
        if (!path.match(/^\/[^/]+\/?$/)) {
            alert('Please run this tool from the profile you want to analyze\nExample: https://www.instagram.com/username/');
            return null;
        }
        return path.split('/')[1];
    };

    const username = getCurrentUsername();
    if (!username) return;

    // Configuration for detecting fake followers
    const config = {
        maxPosts: 0,                      // Maximum posts to consider suspicious
        minFollowers: 10,                 // Minimum followers to consider suspicious
        followersPerRequest: 50,          // Followers per request
        cooldownBetweenProfiles: 2000,    // Time between profile analysis (ms)
        cooldownBetweenRequests: 1000,    // Time between requests (ms)
        retryDelay: 5000                  // Base time for retries (ms)
    };

    // Global variables
    let analysisResults = {
        fakeFollowers: [],
        suspiciousFollowers: [],
        totalFollowers: 0,
        analyzedCount: 0,
        lastUpdate: null,
        analyzedProfiles: new Set()       // Set to store already analyzed profiles
    };

    // Control variables
    let isPaused = false;
    let shouldStop = false;

    // Function to wait for a specified time
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Function to make a request with retries
    const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                
                if (response.status === 429) {
                    const waitTime = (i + 1) * 5000; // 5s, 10s, 15s
                    console.log(`Rate limit reached. Waiting ${waitTime/1000} seconds...`);
                    await wait(waitTime);
                    continue;
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await wait(2000); // Wait 2s between retries
            }
        }
    };

    // Function to get user ID
    const getUserId = async (username) => {
        try {
            const response = await fetchWithRetry(
                `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
                {
                    headers: {
                        'X-IG-App-ID': '936619743392459'
                    }
                }
            );
            const data = await response.json();
            return data.data.user.id;
        } catch (error) {
            console.error('Error getting ID:', error);
            throw error;
        }
    };

    // Function to get all followers at once
    const getAllFollowers = async (userId) => {
        let followers = [];
        let hasNext = true;
        let endCursor = null;
        let totalCount = 0;
        let currentCount = 0;

        // First get total followers
        const initialResponse = await fetchWithRetry(
            `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=${encodeURIComponent(JSON.stringify({
                id: userId,
                first: 1
            }))}`,
            {
                headers: {
                    'X-IG-App-ID': '936619743392459'
                }
            }
        );
        const initialData = await initialResponse.json();
        totalCount = initialData.data.user.edge_followed_by.count;

        while (hasNext) {
            const variables = {
                id: userId,
                first: config.followersPerRequest,
                after: endCursor
            };

            const response = await fetchWithRetry(
                `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=${encodeURIComponent(JSON.stringify(variables))}`,
                {
                    headers: {
                        'X-IG-App-ID': '936619743392459'
                    }
                }
            );

            const data = await response.json();
            const edges = data.data.user.edge_followed_by.edges;
            followers = followers.concat(edges.map(edge => edge.node));
            
            currentCount += edges.length;
            const progress = (currentCount / totalCount) * 100;
            progressBar.style.width = `${33 * (progress / 100)}%`;
            progressText.textContent = `Getting followers list... ${currentCount}/${totalCount} (${progress.toFixed(1)}%)`;
            
            hasNext = data.data.user.edge_followed_by.page_info.has_next_page;
            endCursor = data.data.user.edge_followed_by.page_info.end_cursor;

            // Wait 1 second between requests to avoid limits
            await wait(1000);
        }

        return followers;
    };

    // Function to analyze a profile
    const analyzeProfile = async (username) => {
        try {
            // Wait 2 seconds between each profile analysis
            await wait(2000);

            const response = await fetchWithRetry(
                `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
                {
                    headers: {
                        'X-IG-App-ID': '936619743392459'
                    }
                }
            );

            const data = await response.json();
            const user = data.data.user;
            
            return {
                username: user.username,
                full_name: user.full_name,
                posts: user.edge_owner_to_timeline_media.count,
                followers: user.edge_followed_by.count,
                following: user.edge_follow.count,
                isSuspicious: user.edge_owner_to_timeline_media.count <= config.maxPosts && 
                            user.edge_followed_by.count > config.minFollowers
            };
        } catch (error) {
            console.error(`Error analyzing profile ${username}:`, error);
            return null;
        }
    };

    // Function to save results locally
    const saveResults = () => {
        const data = {
            username,
            config,
            results: {
                ...analysisResults,
                analyzedProfiles: Array.from(analysisResults.analyzedProfiles)
            },
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(`instagram_analyzer_${username}`, JSON.stringify(data));
    };

    // Function to load saved results
    const loadSavedResults = () => {
        const saved = localStorage.getItem(`instagram_analyzer_${username}`);
        if (saved) {
            const data = JSON.parse(saved);
            config = data.config;
            analysisResults = {
                ...data.results,
                analyzedProfiles: new Set(data.results.analyzedProfiles)
            };
            return true;
        }
        return false;
    };

    // Create user interface
    const createUI = () => {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            background: #111;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #fff;
            max-height: 80vh;
            overflow-y: auto;
        `;

        container.innerHTML = `
            <h2 style="margin-bottom: 15px; color: #fff;">Suspicious Accounts Detector</h2>
            <div style="margin-bottom: 15px;">
                <div style="background: #222; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #fff;">Analyzing profile: <strong style="color: #0095f6;">@${username}</strong></p>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="configBtn" style="width: 100%; padding: 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;">
                        ⚙️ Advanced Settings
                    </button>
                    <div id="configPanel" style="display: none; background: #222; padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                        <h3 style="margin-bottom: 15px; color: #fff;">Settings</h3>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Maximum posts to consider suspicious:</label>
                            <input type="number" id="maxPosts" value="${config.maxPosts}" min="0" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Minimum followers to consider suspicious:</label>
                            <input type="number" id="minFollowers" value="${config.minFollowers}" min="1" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Time between profile analysis (ms):</label>
                            <input type="number" id="cooldownBetweenProfiles" value="${config.cooldownBetweenProfiles}" min="1000" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Time between requests (ms):</label>
                            <input type="number" id="cooldownBetweenRequests" value="${config.cooldownBetweenRequests}" min="500" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Base time for retries (ms):</label>
                            <input type="number" id="retryDelay" value="${config.retryDelay}" min="2000" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="saveConfigBtn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Save
                            </button>
                            <button id="cancelConfigBtn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
                <div id="resumePanel" style="display: none; background: #222; padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                    <h3 style="margin-bottom: 15px; color: #fff;">Previous Analysis Found</h3>
                    <p style="color: #fff; margin-bottom: 10px;">A previous analysis of this profile was found.</p>
                    <div style="display: flex; gap: 10px;">
                        <button id="resumeBtn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Resume Analysis
                        </button>
                        <button id="newAnalysisBtn" style="flex: 1; padding: 8px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            New Analysis
                        </button>
                    </div>
                </div>
                <button id="analyzeBtn" style="width: 100%; padding: 10px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Start Analysis
                </button>
            </div>
            <div id="progress" style="display: none;">
                <div style="width: 100%; height: 4px; background: #333; border-radius: 2px; margin: 10px 0;">
                    <div id="progressBar" style="width: 0%; height: 100%; background: #0095f6; border-radius: 2px; transition: width 0.3s;"></div>
                </div>
                <p id="progressText" style="text-align: center; margin: 5px 0;">Getting data...</p>
                <div id="controlButtons" style="display: none; margin-top: 10px; display: flex; gap: 10px;">
                    <button id="pauseBtn" style="flex: 1; padding: 8px; background: #ffd700; color: #000; border: none; border-radius: 4px; cursor: pointer;">
                        ⏸️ Pause
                    </button>
                    <button id="stopBtn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ⏹️ Stop
                    </button>
                </div>
            </div>
            <div id="results" style="display: none;">
                <div id="stats" style="margin-bottom: 15px;"></div>
                <div id="lists" style="display: flex; gap: 10px;">
                    <button id="exportBtn" style="flex: 1; padding: 8px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        📥 Export CSV
                    </button>
                </div>
                <div id="suspiciousFollowers" style="margin-top: 15px;">
                    <h4 style="color: #fff; margin-bottom: 10px;">Suspicious Accounts:</h4>
                    <div id="suspiciousFollowersList" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        
        // Event listeners
        document.getElementById('configBtn').addEventListener('click', () => {
            const panel = document.getElementById('configPanel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            config = {
                maxPosts: parseInt(document.getElementById('maxPosts').value) || 0,
                minFollowers: parseInt(document.getElementById('minFollowers').value) || 10,
                cooldownBetweenProfiles: parseInt(document.getElementById('cooldownBetweenProfiles').value) || 2000,
                cooldownBetweenRequests: parseInt(document.getElementById('cooldownBetweenRequests').value) || 1000,
                retryDelay: parseInt(document.getElementById('retryDelay').value) || 5000,
                followersPerRequest: 50
            };
            document.getElementById('configPanel').style.display = 'none';
            saveResults();
        });

        document.getElementById('cancelConfigBtn').addEventListener('click', () => {
            document.getElementById('configPanel').style.display = 'none';
        });

        document.getElementById('analyzeBtn').addEventListener('click', () => {
            if (loadSavedResults()) {
                document.getElementById('resumePanel').style.display = 'block';
                document.getElementById('analyzeBtn').style.display = 'none';
            } else {
                analyzeAccount();
            }
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            document.getElementById('resumePanel').style.display = 'none';
            document.getElementById('analyzeBtn').style.display = 'block';
            analyzeAccount(true);
        });

        document.getElementById('newAnalysisBtn').addEventListener('click', () => {
            document.getElementById('resumePanel').style.display = 'none';
            document.getElementById('analyzeBtn').style.display = 'block';
            localStorage.removeItem(`instagram_analyzer_${username}`);
            analyzeAccount();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            isPaused = !isPaused;
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
            pauseBtn.style.background = isPaused ? '#28a745' : '#ffd700';
        });
        document.getElementById('stopBtn').addEventListener('click', () => {
            shouldStop = true;
            isPaused = false;
            document.getElementById('controlButtons').style.display = 'none';
            document.getElementById('exportBtn').style.display = 'block';
            document.getElementById('analyzeBtn').disabled = false;
        });
        document.getElementById('exportBtn').addEventListener('click', () => {
            if (analysisResults.suspiciousFollowers.length === 0) {
                alert('No data to export');
                return;
            }
            const filename = `suspicious_accounts_${username}_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(analysisResults.suspiciousFollowers, filename);
        });
    };

    // Function to convert data to CSV
    const convertToCSV = (data) => {
        const header = ['username', 'posts', 'followers'];
        const rows = data.map(item => [
            item.username,
            item.posts,
            item.followers
        ]);
        return [header, ...rows]
            .map(row => row.join(','))
            .join('\n');
    };

    // Function to download CSV
    const downloadCSV = (data, filename) => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Main analysis function
    const analyzeAccount = async (isResume = false) => {
        // Update configuration
        config.maxPosts = parseInt(document.getElementById('maxPosts').value) || 0;
        config.minFollowers = parseInt(document.getElementById('minFollowers').value) || 10;

        const progress = document.getElementById('progress');
        const results = document.getElementById('results');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const controlButtons = document.getElementById('controlButtons');
        const exportBtn = document.getElementById('exportBtn');
        
        progress.style.display = 'block';
        results.style.display = 'none';
        analyzeBtn.disabled = true;
        controlButtons.style.display = 'none';
        exportBtn.style.display = 'none';
        
        // Reset control variables
        isPaused = false;
        shouldStop = false;
        
        try {
            // Get user ID
            progressText.textContent = 'Getting user ID...';
            const userId = await getUserId(username);

            // Get all followers
            progressText.textContent = 'Getting followers list...';
            progressBar.style.width = '0%';
            const followers = await getAllFollowers(userId);
            
            // Analyze each follower
            progressText.textContent = 'Analyzing profiles...';
            progressBar.style.width = '33%';
            controlButtons.style.display = 'flex';
            
            const suspiciousFollowers = isResume ? [...analysisResults.suspiciousFollowers] : [];
            for (let i = 0; i < followers.length; i++) {
                if (shouldStop) break;
                
                while (isPaused) {
                    await wait(1000);
                }
                
                const follower = followers[i];
                
                // If resuming and we already analyzed this profile, skip it
                if (isResume && analysisResults.analyzedProfiles.has(follower.username)) {
                    const progress = ((i + 1) / followers.length) * 100;
                    progressBar.style.width = `${33 + (progress * 0.67)}%`;
                    progressText.textContent = `Analyzing profiles... ${i + 1}/${followers.length} (${progress.toFixed(1)}%)`;
                    continue;
                }
                
                const profileData = await analyzeProfile(follower.username);
                if (profileData) {
                    analysisResults.analyzedProfiles.add(follower.username);
                    if (profileData.isSuspicious) {
                        suspiciousFollowers.push(profileData);
                    }
                }
                
                // Update progress
                const progress = ((i + 1) / followers.length) * 100;
                progressBar.style.width = `${33 + (progress * 0.67)}%`;
                progressText.textContent = `Analyzing profiles... ${i + 1}/${followers.length} (${progress.toFixed(1)}%)`;
            }

            // Update results
            analysisResults = {
                suspiciousFollowers,
                totalFollowers: followers.length,
                analyzedCount: followers.length,
                lastUpdate: new Date().toISOString(),
                analyzedProfiles: analysisResults.analyzedProfiles
            };

            // Save results
            saveResults();

            // Display results
            const stats = document.getElementById('stats');
            const suspiciousFollowersList = document.getElementById('suspiciousFollowersList');

            stats.innerHTML = `
                <p>Total Followers: ${followers.length}</p>
                <p>Suspicious Accounts Found: ${suspiciousFollowers.length}</p>
                <p>Percentage of Suspicious Accounts: ${((suspiciousFollowers.length / followers.length) * 100).toFixed(1)}%</p>
            `;

            suspiciousFollowersList.innerHTML = suspiciousFollowers.map(user => `
                <div style="padding: 10px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                    <div>
                        <a href="https://instagram.com/${user.username}" target="_blank" style="color: #0095f6; text-decoration: none;">
                            @${user.username}
                        </a>
                    </div>
                    <div style="color: #999;">
                        ${user.posts} posts · ${user.followers} followers
                    </div>
                </div>
            `).join('');

            progress.style.display = 'none';
            results.style.display = 'block';

        } catch (error) {
            console.error('Error during analysis:', error);
            alert('Error analyzing account. Please try again.');
        } finally {
            analyzeBtn.disabled = false;
            controlButtons.style.display = 'none';
            exportBtn.style.display = 'block';
        }
    };

    // Initialize user interface
    createUI();
})(); 