// Tennis Dashboard Application

// ========================================
// CONFIGURATION - EDIT THESE VALUES
// ========================================
const CONFIG = {
    apiKey: 'AIzaSyD3zdkybwX5Bch5KYIa4FjLuThDi4SJKMQ',
    spreadsheetId: '1Wrw7-ZpuvmsJHzAkjDQf0sdLazJufuOcHGPwS5mj8q8',
    sheetName: 'Form Responses 1',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScD2TzG96eYQVWXNG8sa0w5ugdZ9VCzVbY67NoEzLcyOwlb0g/viewform?usp=header'  // Add your Google Form URL here
};
// ========================================

class TennisDashboard {
    constructor() {
        this.matches = [];
        this.config = CONFIG;
        this.init();
    }

    async init() {
        if (this.config.apiKey === 'YOUR_API_KEY_HERE' || this.config.spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
            this.renderSetup();
        } else {
            await this.loadData();
        }
    }

    async loadData() {
        const { apiKey, spreadsheetId, sheetName } = this.config;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data. Check your API key and Spreadsheet ID in app.js');
            
            const data = await response.json();
            const rows = data.values;

            if (!rows || rows.length < 2) {
                throw new Error('No data found in sheet');
            }

            // Parse data based on actual column structure
            this.matches = rows.slice(1).map(row => {
                let dateCol, p1Col, p1ScoreCol, p2Col, p2ScoreCol;
                
                // Check if first column looks like timestamp or email
                if (row[0] && (row[0].includes('@') || row[0].includes('/'))) {
                    dateCol = row[1] && row[1].includes('/') ? 1 : 2;
                    p1Col = dateCol + 1;
                    p1ScoreCol = dateCol + 2;
                    p2Col = dateCol + 3;
                    p2ScoreCol = dateCol + 4;
                } else {
                    dateCol = 0;
                    p1Col = 1;
                    p1ScoreCol = 2;
                    p2Col = 3;
                    p2ScoreCol = 4;
                }

                return {
                    date: row[dateCol] || '',
                    player1: row[p1Col] || '',
                    score1: parseInt(row[p1ScoreCol]) || 0,
                    player2: row[p2Col] || '',
                    score2: parseInt(row[p2ScoreCol]) || 0,
                };
            }).reverse();

            this.renderDashboard();
        } catch (error) {
            this.renderError(error.message);
        }
    }

    getPlayers() {
        const players = new Set();
        this.matches.forEach(m => {
            if (m.player1) players.add(m.player1);
            if (m.player2) players.add(m.player2);
        });
        return Array.from(players);
    }

    getPlayerStats(playerName) {
        let wins = 0, losses = 0, gamesWon = 0, gamesLost = 0;

        this.matches.forEach(match => {
            if (match.player1 === playerName) {
                gamesWon += match.score1;
                gamesLost += match.score2;
                if (match.score1 > match.score2) wins++;
                else losses++;
            } else if (match.player2 === playerName) {
                gamesWon += match.score2;
                gamesLost += match.score1;
                if (match.score2 > match.score1) wins++;
                else losses++;
            }
        });

        return {
            wins,
            losses,
            winPct: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0,
            gamesWon,
            gamesLost,
            avgGamesWon: (wins + losses > 0 ? (gamesWon / (wins + losses)).toFixed(1) : 0)
        };
    }

    getHeadToHead(p1, p2) {
        let p1Wins = 0, p2Wins = 0;

        this.matches.forEach(match => {
            if ((match.player1 === p1 && match.player2 === p2) ||
                (match.player1 === p2 && match.player2 === p1)) {
                if (match.player1 === p1 && match.score1 > match.score2) p1Wins++;
                else if (match.player2 === p1 && match.score2 > match.score1) p1Wins++;
                else if (match.player1 === p2 && match.score1 > match.score2) p2Wins++;
                else if (match.player2 === p2 && match.score2 > match.score1) p2Wins++;
            }
        });

        return { p1Wins, p2Wins };
    }

    getHeadToHeadGames(p1, p2) {
        let p1Games = 0, p2Games = 0;

        this.matches.forEach(match => {
            if (match.player1 === p1 && match.player2 === p2) {
                p1Games += match.score1;
                p2Games += match.score2;
            } else if (match.player1 === p2 && match.player2 === p1) {
                p1Games += match.score2;
                p2Games += match.score1;
            }
        });

        return { p1Games, p2Games };
    }

    getWinPercentageOverTime(players) {
        const playerStats = {};
        players.forEach(p => {
            playerStats[p] = { gamesWon: 0, gamesLost: 0, history: [] };
        });

        // Process matches in chronological order (oldest first)
        const chronologicalMatches = [...this.matches].reverse();
        
        chronologicalMatches.forEach(match => {
            // Update stats for player 1
            if (playerStats[match.player1]) {
                playerStats[match.player1].gamesWon += match.score1;
                playerStats[match.player1].gamesLost += match.score2;
                
                const total = playerStats[match.player1].gamesWon + playerStats[match.player1].gamesLost;
                const winPct = (playerStats[match.player1].gamesWon / total) * 100;
                playerStats[match.player1].history.push({
                    date: match.date,
                    winPct: winPct.toFixed(1)
                });
            }

            // Update stats for player 2
            if (playerStats[match.player2]) {
                playerStats[match.player2].gamesWon += match.score2;
                playerStats[match.player2].gamesLost += match.score1;
                
                const total = playerStats[match.player2].gamesWon + playerStats[match.player2].gamesLost;
                const winPct = (playerStats[match.player2].gamesWon / total) * 100;
                playerStats[match.player2].history.push({
                    date: match.date,
                    winPct: winPct.toFixed(1)
                });
            }
        });

        return playerStats;
    }

    renderChart(players) {
        const winPctData = this.getWinPercentageOverTime(players);
        const canvas = document.getElementById('winPctChart');
        const ctx = canvas.getContext('2d');
        
        // Responsive sizing
        const container = canvas.parentElement;
        const containerWidth = container.offsetWidth - 32; // Account for padding
        const isMobile = containerWidth < 768;
        
        canvas.width = containerWidth;
        canvas.height = isMobile ? 300 : 400;
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = isMobile ? 40 : 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, width, height);

        // Draw grid and axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = padding + (chartHeight / 10) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Y-axis labels
            ctx.fillStyle = '#6b7280';
            ctx.font = isMobile ? '10px sans-serif' : '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${100 - i * 10}%`, padding - 5, y + 4);
        }

        // Draw axes
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Colors for each player
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
        let colorIndex = 0;

        // Find max history length for x-axis scaling
        let maxHistoryLength = 0;
        players.forEach(player => {
            const data = winPctData[player];
            if (data && data.history.length > maxHistoryLength) {
                maxHistoryLength = data.history.length;
            }
        });

        // Draw lines for each player
        players.forEach(player => {
            const data = winPctData[player];
            if (!data || data.history.length === 0) return;

            const color = colors[colorIndex % colors.length];
            colorIndex++;

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = isMobile ? 2 : 3;
            ctx.beginPath();

            data.history.forEach((point, index) => {
                const x = padding + (chartWidth / (maxHistoryLength - 1 || 1)) * index;
                const y = padding + chartHeight - (point.winPct / 100) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Draw point
                const pointSize = isMobile ? 2 : 3;
                ctx.fillRect(x - pointSize, y - pointSize, pointSize * 2, pointSize * 2);
            });

            ctx.stroke();
        });

        // Draw legend
        const legendY = height - padding + (isMobile ? 20 : 30);
        ctx.font = isMobile ? '11px sans-serif' : '14px sans-serif';
        ctx.textAlign = 'left';

        colorIndex = 0;
        let legendX = padding;
        
        players.forEach((player, idx) => {
            const color = colors[colorIndex % colors.length];
            colorIndex++;

            // On mobile, wrap legend to multiple lines if needed
            if (isMobile && idx > 0 && legendX > width - 100) {
                legendX = padding;
            }

            // Draw color box
            ctx.fillStyle = color;
            const boxSize = isMobile ? 12 : 15;
            ctx.fillRect(legendX, legendY, boxSize, boxSize);

            // Draw player name
            ctx.fillStyle = '#374151';
            ctx.fillText(player, legendX + boxSize + 5, legendY + (isMobile ? 10 : 12));

            legendX += ctx.measureText(player).width + boxSize + (isMobile ? 20 : 40);
        });
    }

    renderSetup() {
        document.getElementById('app').innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-6">
                <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                    <h1 class="text-3xl font-bold text-gray-800 mb-6">⚙️ Configuration Required</h1>
                    
                    <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                        <p class="font-semibold mb-2">Setup Instructions:</p>
                        <ol class="list-decimal list-inside space-y-2 text-sm text-gray-700">
                            <li>Get your Google Sheets API Key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-blue-600 underline">Google Cloud Console</a></li>
                            <li>Get your Spreadsheet ID from your Google Sheet URL</li>
                            <li>Open <code class="bg-gray-100 px-2 py-1 rounded">app.js</code> in your GitHub repository</li>
                            <li>Click the edit button (pencil icon)</li>
                            <li>Find the CONFIG section at the top of the file</li>
                            <li>Replace <code class="bg-gray-100 px-2 py-1 rounded">YOUR_API_KEY_HERE</code> with your actual API key</li>
                            <li>Replace <code class="bg-gray-100 px-2 py-1 rounded">YOUR_SPREADSHEET_ID_HERE</code> with your actual spreadsheet ID</li>
                            <li>Update the sheet name if needed</li>
                            <li>Commit the changes</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p class="font-semibold mb-2">Example CONFIG section:</p>
                        <pre class="text-xs bg-white p-3 rounded overflow-x-auto"><code>const CONFIG = {
    apiKey: 'AIzaSyD3zdkybwX5Bch5KYIa4FjLuThDi4SJKMQ',
    spreadsheetId: '1Wrw7-ZpuvmsJHzAkjDQf0sdLazJufuOcHGPwS5mj8q8',
    sheetName: 'Form_Responses'
};</code></pre>
                    </div>
                </div>
            </div>
        `;
    }

    renderError(message) {
        document.getElementById('app').innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-6">
                <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
                    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <p class="font-semibold mb-2">Error:</p>
                        <p>${message}</p>
                    </div>
                    <button onclick="location.reload()" 
                        class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    renderDashboard() {
        const players = this.getPlayers();
        const allStats = players.map(p => ({ name: p, ...this.getPlayerStats(p) }));
        const sortedByWins = allStats.sort((a, b) => b.winPct - a.winPct);

        let headToHeadHTML = '';
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const h2h = this.getHeadToHead(players[i], players[j]);
                headToHeadHTML += `
                    <div class="border-2 border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div class="text-center flex-1">
                                <div class="font-bold text-lg">${players[i]}</div>
                                <div class="text-3xl font-bold text-green-600">${h2h.p1Wins}</div>
                            </div>
                            <div class="text-gray-400 font-bold text-xl">VS</div>
                            <div class="text-center flex-1">
                                <div class="font-bold text-lg">${players[j]}</div>
                                <div class="text-3xl font-bold text-blue-600">${h2h.p2Wins}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        let headToHeadGamesHTML = '';
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const h2hGames = this.getHeadToHeadGames(players[i], players[j]);
                headToHeadGamesHTML += `
                    <div class="border-2 border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div class="text-center flex-1">
                                <div class="font-bold text-lg">${players[i]}</div>
                                <div class="text-3xl font-bold text-green-600">${h2hGames.p1Games}</div>
                            </div>
                            <div class="text-gray-400 font-bold text-xl">VS</div>
                            <div class="text-center flex-1">
                                <div class="font-bold text-lg">${players[j]}</div>
                                <div class="text-3xl font-bold text-blue-600">${h2hGames.p2Games}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        const recentMatchesHTML = this.matches.slice(0, 10).map(match => `
            <div class="border-l-4 border-blue-500 bg-gray-50 p-4 rounded">
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="text-sm text-gray-600">${match.date}</div>
                    <div class="flex items-center gap-4">
                        <span class="font-semibold ${match.score1 > match.score2 ? 'text-green-600' : 'text-gray-600'}">
                            ${match.player1}
                        </span>
                        <span class="font-bold text-xl">${match.score1} - ${match.score2}</span>
                        <span class="font-semibold ${match.score2 > match.score1 ? 'text-green-600' : 'text-gray-600'}">
                            ${match.player2}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('app').innerHTML = `
            <div class="max-w-7xl mx-auto p-6">
                <div class="text-center mb-6">
                    <h1 class="text-4xl font-bold text-gray-800 mb-2">Tennis Dashboard</h1>
                    <p class="text-gray-600">${players.join(', ')}</p>
                    <div class="mt-4 space-x-2">
                        <button onclick="dashboard.loadData()" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            🔄 Refresh Data
                        </button>
                        ${this.config.googleFormUrl && this.config.googleFormUrl !== 'YOUR_GOOGLE_FORM_URL_HERE' ? `
                        <button onclick="dashboard.toggleForm()" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                            ➕ Add Score
                        </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Google Form Section (Hidden by default) -->
                ${this.config.googleFormUrl && this.config.googleFormUrl !== 'YOUR_GOOGLE_FORM_URL_HERE' ? `
                <div id="formSection" class="bg-white rounded-lg shadow-lg p-6 mb-6 hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">📝 Add New Score</h2>
                        <button onclick="dashboard.toggleForm()" class="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <iframe src="${this.config.googleFormUrl}" 
                        width="100%" 
                        height="600" 
                        frameborder="0" 
                        marginheight="0" 
                        marginwidth="0">
                        Loading…
                    </iframe>
                </div>
                ` : ''}

                <!-- Leaderboard -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b-2 border-gray-200">
                                    <th class="text-left py-3 px-4">Rank</th>
                                    <th class="text-left py-3 px-4">Player</th>
                                    <th class="text-center py-3 px-4">Sets Won</th>
                                    <th class="text-center py-3 px-4">Sets Lost</th>
                                    <th class="text-center py-3 px-4">Win %</th>
                                    <th class="text-center py-3 px-4">Games Won</th>
                                    <th class="text-center py-3 px-4">Games Lost</th>
                                    <th class="text-center py-3 px-4">Game Win %</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedByWins.map((player, idx) => `
                                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                                        <td class="py-3 px-4 font-bold">${idx + 1}</td>
                                        <td class="py-3 px-4 font-semibold">${player.name}</td>
                                        <td class="text-center py-3 px-4">${player.wins}</td>
                                        <td class="text-center py-3 px-4">${player.losses}</td>
                                        <td class="text-center py-3 px-4 font-semibold text-green-600">${player.winPct}%</td>
                                        <td class="text-center py-3 px-4">${player.gamesWon}</td>
                                        <td class="text-center py-3 px-4">${player.gamesLost}</td>
                                        <td class="text-center py-3 px-4 font-semibold text-blue-600">${((player.gamesWon / (player.gamesWon + player.gamesLost)) * 100).toFixed(1)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Head to Head Sets -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">👥 Head-to-Head Sets</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${headToHeadHTML}
                    </div>
                </div>

                <!-- Head to Head Games -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">🎾 Head-to-Head Games</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${headToHeadGamesHTML}
                    </div>
                </div>

                <!-- Win Percentage Over Time -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">📈 Game Win % Over Time</h2>
                    <canvas id="winPctChart"></canvas>
                </div>

                <!-- Recent Matches -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">📅 Recent Sets</h2>
                    <div class="space-y-3">
                        ${recentMatchesHTML}
                    </div>
                </div>
            </div>
        `;

        // Render the chart after DOM is updated
        setTimeout(() => this.renderChart(players), 0);
    }

    toggleForm() {
        const formSection = document.getElementById('formSection');
        if (formSection) {
            formSection.classList.toggle('hidden');
        }
    }
}

// Initialize dashboard
const dashboard = new TennisDashboard();
