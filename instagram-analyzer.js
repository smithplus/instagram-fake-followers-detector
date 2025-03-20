// Instagram Fake Followers Detector
// Ejecutar este código en la consola del navegador mientras estás en un perfil de Instagram

(() => {
    // Verificar que estamos en Instagram y en un perfil
    if (location.hostname !== 'www.instagram.com') {
        alert('Esta herramienta solo puede usarse en Instagram');
        return;
    }

    // Obtener username de la URL actual
    const getCurrentUsername = () => {
        const path = window.location.pathname;
        if (!path.match(/^\/[^/]+\/?$/)) {
            alert('Por favor, ejecuta esta herramienta desde el perfil del usuario que quieres analizar\nEjemplo: https://www.instagram.com/username/');
            return null;
        }
        return path.split('/')[1];
    };

    const username = getCurrentUsername();
    if (!username) return;

    // Configuration for detecting fake followers
    const config = {
        followersFollowingRatio: 2.0,    // Followers/following ratio
        minPostsPerMonth: 2,            // Minimum posts per month
        minEngagementRate: 0.01,        // Minimum engagement rate
        minAccountAge: 30,              // Minimum account age in days
        requireProfilePic: true,        // Require profile picture
        requireBio: true,               // Require biography
        batchSize: 50                   // Analysis batch size
    };

    class InstagramAnalyzer {
        constructor() {
            this.followers = [];
            this.suspiciousAccounts = [];
            this.isAnalyzing = false;
            this.paused = false;
        }

        async startAnalysis() {
            if (this.isAnalyzing) {
                console.log('Analysis is already in progress');
                return;
            }

            this.isAnalyzing = true;
            this.paused = false;
            console.log('Starting analysis...');
            
            try {
                await this.getFollowers();
                await this.analyzeFollowers();
                this.displayResults();
            } catch (error) {
                console.error('Error during analysis:', error);
            } finally {
                this.isAnalyzing = false;
            }
        }

        async getFollowers() {
            console.log('Fetching followers...');
            const userId = await this.getUserId();
            this.followers = await this.getAllFollowers(userId);
            console.log(`Found ${this.followers.length} followers`);
        }

        async analyzeFollowers() {
            console.log('Analyzing followers...');
            const batches = Math.ceil(this.followers.length / config.batchSize);
            
            for (let i = 0; i < batches; i++) {
                if (this.paused) {
                    console.log('Analysis paused. Click "Resume" to continue.');
                    await new Promise(resolve => {
                        const checkPause = setInterval(() => {
                            if (!this.paused) {
                                clearInterval(checkPause);
                                resolve();
                            }
                        }, 1000);
                    });
                }

                const start = i * config.batchSize;
                const end = Math.min(start + config.batchSize, this.followers.length);
                const batch = this.followers.slice(start, end);
                
                await this.analyzeBatch(batch);
                
                const progress = ((i + 1) / batches * 100).toFixed(1);
                console.log(`Progress: ${progress}%`);
            }
        }

        async analyzeBatch(batch) {
            for (const follower of batch) {
                if (await this.isSuspiciousAccount(follower)) {
                    this.suspiciousAccounts.push(follower);
                }
            }
        }

        async isSuspiciousAccount(account) {
            const profile = await this.getProfileInfo(account.id);
            
            // Check followers/following ratio
            const ratio = profile.followers_count / (profile.following_count || 1);
            if (ratio < config.followersFollowingRatio) return true;

            // Check posts per month
            const postsPerMonth = this.calculatePostsPerMonth(profile);
            if (postsPerMonth < config.minPostsPerMonth) return true;

            // Check engagement rate
            const engagementRate = this.calculateEngagementRate(profile);
            if (engagementRate < config.minEngagementRate) return true;

            // Check account age
            const accountAge = this.calculateAccountAge(profile);
            if (accountAge < config.minAccountAge) return true;

            // Check profile completeness
            if (config.requireProfilePic && !profile.profile_pic_url) return true;
            if (config.requireBio && !profile.biography) return true;

            return false;
        }

        displayResults() {
            console.log('\n=== Analysis Results ===');
            console.log(`Total followers analyzed: ${this.followers.length}`);
            console.log(`Suspicious accounts detected: ${this.suspiciousAccounts.length}`);
            console.log(`Percentage of suspicious accounts: ${(this.suspiciousAccounts.length / this.followers.length * 100).toFixed(2)}%`);
            
            if (this.suspiciousAccounts.length > 0) {
                console.log('\nSuspicious Accounts:');
                this.suspiciousAccounts.forEach(account => {
                    console.log(`- @${account.username}`);
                });
            }

            this.exportToCSV();
        }

        exportToCSV() {
            const csv = this.generateCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'suspicious_accounts.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }

        generateCSV() {
            const headers = ['Username', 'Followers', 'Following', 'Posts', 'Engagement Rate', 'Account Age (days)'];
            const rows = this.suspiciousAccounts.map(account => [
                account.username,
                account.followers_count,
                account.following_count,
                account.media_count,
                this.calculateEngagementRate(account).toFixed(4),
                this.calculateAccountAge(account)
            ]);

            return [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
        }

        pauseAnalysis() {
            this.paused = true;
            console.log('Analysis paused');
        }

        resumeAnalysis() {
            this.paused = false;
            console.log('Analysis resumed');
        }

        // Helper methods
        calculatePostsPerMonth(profile) {
            const accountAge = this.calculateAccountAge(profile);
            return (profile.media_count / accountAge) * 30;
        }

        calculateEngagementRate(profile) {
            if (!profile.media_count) return 0;
            const totalLikes = profile.media_count * 100; // Estimated average likes per post
            return totalLikes / profile.followers_count;
        }

        calculateAccountAge(profile) {
            const createdAt = new Date(profile.created_at);
            const now = new Date();
            return Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        }
    }

    // Variables globales
    let analysisResults = {
        fakeFollowers: [],
        suspiciousFollowers: [],
        totalFollowers: 0,
        analyzedCount: 0,
        lastUpdate: null,
        analyzedProfiles: new Set()       // Set para guardar perfiles ya analizados
    };

    // Variables de control
    let isPaused = false;
    let shouldStop = false;

    // Función para esperar un tiempo determinado
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Función para hacer una petición con reintentos
    const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                
                if (response.status === 429) {
                    const waitTime = (i + 1) * 5000; // 5s, 10s, 15s
                    console.log(`Rate limit alcanzado. Esperando ${waitTime/1000} segundos...`);
                    await wait(waitTime);
                    continue;
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await wait(2000); // Esperar 2s entre reintentos
            }
        }
    };

    // Función para obtener ID del usuario
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
            console.error('Error al obtener ID:', error);
            throw error;
        }
    };

    // Función para obtener todos los seguidores de una vez
    const getAllFollowers = async (userId) => {
        let followers = [];
        let hasNext = true;
        let endCursor = null;
        let totalCount = 0;
        let currentCount = 0;

        // Primero obtener el total de seguidores
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
                first: config.batchSize,
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
            progressText.textContent = `Obteniendo lista de seguidores... ${currentCount}/${totalCount} (${progress.toFixed(1)}%)`;
            
            hasNext = data.data.user.edge_followed_by.page_info.has_next_page;
            endCursor = data.data.user.edge_followed_by.page_info.end_cursor;

            // Esperar 1 segundo entre solicitudes para evitar límites
            await wait(1000);
        }

        return followers;
    };

    // Función para obtener todos los seguidos de una vez
    const getAllFollowing = async (userId) => {
        let following = [];
        let hasNext = true;
        let endCursor = null;

        while (hasNext) {
            const variables = {
                id: userId,
                first: config.batchSize,
                after: endCursor
            };

            const response = await fetch(`https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=${encodeURIComponent(JSON.stringify(variables))}`, {
                headers: {
                    'X-IG-App-ID': '936619743392459'
                }
            });

            const data = await response.json();
            const edges = data.data.user.edge_follow.edges;
            following = following.concat(edges.map(edge => edge.node));
            
            hasNext = data.data.user.edge_follow.page_info.has_next_page;
            endCursor = data.data.user.edge_follow.page_info.end_cursor;
        }

        return following;
    };

    // Función para analizar un perfil
    const analyzeProfile = async (username) => {
        try {
            // Esperar 2 segundos entre cada análisis de perfil
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
            console.error(`Error al analizar perfil ${username}:`, error);
            return null;
        }
    };

    // Función para guardar resultados localmente
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

    // Función para cargar resultados guardados
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

    // Crear la interfaz de usuario
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
            <h2 style="margin-bottom: 15px; color: #fff;">Detector de Cuentas Sospechosas</h2>
            <div style="margin-bottom: 15px;">
                <div style="background: #222; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #fff;">Analizando perfil: <strong style="color: #0095f6;">@${username}</strong></p>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="configBtn" style="width: 100%; padding: 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;">
                        ⚙️ Configuración Avanzada
                    </button>
                    <div id="configPanel" style="display: none; background: #222; padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                        <h3 style="margin-bottom: 15px; color: #fff;">Configuración</h3>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Máximo posts para considerar sospechoso:</label>
                            <input type="number" id="maxPosts" value="${config.maxPosts}" min="0" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Mínimo seguidores para considerar sospechoso:</label>
                            <input type="number" id="minFollowers" value="${config.minFollowers}" min="1" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Tiempo entre análisis de perfiles (ms):</label>
                            <input type="number" id="cooldownBetweenProfiles" value="${config.cooldownBetweenProfiles}" min="1000" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Tiempo entre solicitudes (ms):</label>
                            <input type="number" id="cooldownBetweenRequests" value="${config.cooldownBetweenRequests}" min="500" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; color: #fff;">Tiempo base para reintentos (ms):</label>
                            <input type="number" id="retryDelay" value="${config.retryDelay}" min="2000" 
                                style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="saveConfigBtn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Guardar
                            </button>
                            <button id="cancelConfigBtn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
                <div id="resumePanel" style="display: none; background: #222; padding: 15px; border-radius: 4px; margin-bottom: 10px;">
                    <h3 style="margin-bottom: 15px; color: #fff;">Análisis Anterior Encontrado</h3>
                    <p style="color: #fff; margin-bottom: 10px;">Se encontró un análisis anterior de este perfil.</p>
                    <div style="display: flex; gap: 10px;">
                        <button id="resumeBtn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Reanudar Análisis
                        </button>
                        <button id="newAnalysisBtn" style="flex: 1; padding: 8px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Nuevo Análisis
                        </button>
                    </div>
                </div>
                <button id="analyzeBtn" style="width: 100%; padding: 10px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Comenzar Análisis
                </button>
            </div>
            <div id="progress" style="display: none;">
                <div style="width: 100%; height: 4px; background: #333; border-radius: 2px; margin: 10px 0;">
                    <div id="progressBar" style="width: 0%; height: 100%; background: #0095f6; border-radius: 2px; transition: width 0.3s;"></div>
                </div>
                <p id="progressText" style="text-align: center; margin: 5px 0;">Obteniendo datos...</p>
                <div id="controlButtons" style="display: none; margin-top: 10px; display: flex; gap: 10px;">
                    <button id="pauseBtn" style="flex: 1; padding: 8px; background: #ffd700; color: #000; border: none; border-radius: 4px; cursor: pointer;">
                        ⏸️ Pausar
                    </button>
                    <button id="stopBtn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ⏹️ Detener
                    </button>
                </div>
            </div>
            <div id="results" style="display: none;">
                <div id="stats" style="margin-bottom: 15px;"></div>
                <div id="lists" style="display: flex; gap: 10px;">
                    <button id="exportBtn" style="flex: 1; padding: 8px; background: #0095f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        📥 Exportar CSV
                    </button>
                </div>
                <div id="suspiciousFollowers" style="margin-top: 15px;">
                    <h4 style="color: #fff; margin-bottom: 10px;">Cuentas Sospechosas:</h4>
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
            pauseBtn.textContent = isPaused ? '▶️ Reanudar' : '⏸️ Pausar';
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
                alert('No hay datos para exportar');
                return;
            }
            const filename = `cuentas_sospechosas_${username}_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(analysisResults.suspiciousFollowers, filename);
        });
    };

    // Función para convertir datos a CSV
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

    // Función para descargar CSV
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

    // Función principal de análisis modificada
    const analyzeAccount = async (isResume = false) => {
        // Actualizar configuración
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
        
        // Reiniciar variables de control
        isPaused = false;
        shouldStop = false;
        
        try {
            // Obtener ID del usuario
            progressText.textContent = 'Obteniendo ID del usuario...';
            const userId = await getUserId(username);

            // Obtener todos los seguidores
            progressText.textContent = 'Obteniendo lista de seguidores...';
            progressBar.style.width = '0%';
            const followers = await getAllFollowers(userId);
            
            // Analizar cada seguidor
            progressText.textContent = 'Analizando perfiles...';
            progressBar.style.width = '33%';
            controlButtons.style.display = 'flex';
            
            const suspiciousFollowers = isResume ? [...analysisResults.suspiciousFollowers] : [];
            for (let i = 0; i < followers.length; i++) {
                if (shouldStop) break;
                
                while (isPaused) {
                    await wait(1000);
                }
                
                const follower = followers[i];
                
                // Si es un reanudar y ya analizamos este perfil, saltarlo
                if (isResume && analysisResults.analyzedProfiles.has(follower.username)) {
                    const progress = ((i + 1) / followers.length) * 100;
                    progressBar.style.width = `${33 + (progress * 0.67)}%`;
                    progressText.textContent = `Analizando perfiles... ${i + 1}/${followers.length} (${progress.toFixed(1)}%)`;
                    continue;
                }
                
                const profileData = await analyzeProfile(follower.username);
                if (profileData) {
                    analysisResults.analyzedProfiles.add(follower.username);
                    if (profileData.isSuspicious) {
                        suspiciousFollowers.push(profileData);
                    }
                }
                
                // Actualizar progreso
                const progress = ((i + 1) / followers.length) * 100;
                progressBar.style.width = `${33 + (progress * 0.67)}%`;
                progressText.textContent = `Analizando perfiles... ${i + 1}/${followers.length} (${progress.toFixed(1)}%)`;
            }

            // Actualizar resultados
            analysisResults = {
                suspiciousFollowers,
                totalFollowers: followers.length,
                analyzedCount: followers.length,
                lastUpdate: new Date().toISOString(),
                analyzedProfiles: analysisResults.analyzedProfiles
            };

            // Guardar resultados
            saveResults();

            // Mostrar resultados
            const stats = document.getElementById('stats');
            const suspiciousFollowersList = document.getElementById('suspiciousFollowersList');

            stats.innerHTML = `
                <p>Total de Seguidores: ${followers.length}</p>
                <p>Cuentas Sospechosas Encontradas: ${suspiciousFollowers.length}</p>
                <p>Porcentaje de Cuentas Sospechosas: ${((suspiciousFollowers.length / followers.length) * 100).toFixed(1)}%</p>
            `;

            suspiciousFollowersList.innerHTML = suspiciousFollowers.map(user => `
                <div style="padding: 10px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                    <div>
                        <a href="https://instagram.com/${user.username}" target="_blank" style="color: #0095f6; text-decoration: none;">
                            @${user.username}
                        </a>
                    </div>
                    <div style="color: #999;">
                        ${user.posts} posts · ${user.followers} seguidores
                    </div>
                </div>
            `).join('');

            progress.style.display = 'none';
            results.style.display = 'block';

        } catch (error) {
            console.error('Error en el análisis:', error);
            alert('Error al analizar la cuenta. Por favor intenta de nuevo.');
        } finally {
            analyzeBtn.disabled = false;
            controlButtons.style.display = 'none';
            exportBtn.style.display = 'block';
        }
    };

    // Inicializar la interfaz
    createUI();
})(); 