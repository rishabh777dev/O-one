#!/usr/bin/env bash
set -e

echo "=== O1 Host Daemon & Antigravity Setup for Azure VM ==="

# 1. Update system & install prerequisites
sudo apt-get update && sudo apt-get install -y curl git ufw jq build-essential

# 2. Install Node.js 22.x LTS
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install Tailscale for encrypted private mesh networking
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh
fi

# 4. Install Antigravity CLI & Hermes tools
echo "Checking Antigravity CLI..."
# In production, installs the agy binary or npm global package

# 5. Create Systemd Service for 24/7 daemon
cat << 'EOF' | sudo tee /etc/systemd/system/o1-daemon.service
[Unit]
Description=O1 Mobile Host Bridge Daemon
After=network.target tailscaled.service

[Service]
Type=simple
User=azureuser
WorkingDirectory=/home/azureuser/o1-host
ExecStart=/usr/bin/node /home/azureuser/o1-host/server.js
Restart=always
RestartSec=5
Environment=PORT=8443
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable o1-daemon.service

echo "=== Setup Complete! Your Azure VM is ready for O1 Mobile Cockpit ==="
echo "Tailscale IP:"
tailscale ip -4
