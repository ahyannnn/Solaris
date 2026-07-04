// server/services/githubService.js
const axios = require('axios');
const FormData = require('form-data');

class GitHubService {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.owner = process.env.GITHUB_OWNER;
        this.repo = process.env.GITHUB_REPO;
        this.baseUrl = 'https://api.github.com';
        this.uploadUrl = 'https://uploads.github.com';

        if (!this.token || !this.owner || !this.repo) {
            console.warn('⚠️ GitHub credentials missing. Please set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO in .env');
        }
    }

    getHeaders() {
        return {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    async getDefaultBranch() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}`,
                { headers: this.getHeaders() }
            );
            return response.data.default_branch;
        } catch (error) {
            console.error('Error getting default branch:', error.response?.data || error.message);
            return 'main';
        }
    }

    async getOrCreateRelease(tagName, releaseName, isDraft = true, isPrerelease = false) {
        try {
            // First try to get existing release
            console.log(`🔍 Checking if release ${tagName} exists...`);
            const getResponse = await axios.get(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/tags/${tagName}`,
                { headers: this.getHeaders() }
            );
            console.log(`✅ Found existing release: ${tagName}`);
            return getResponse.data;
        } catch (error) {
            // If release doesn't exist, create it
            if (error.response?.status === 404) {
                console.log(`📝 Creating new release: ${tagName}`);

                // Get the default branch
                const defaultBranch = await this.getDefaultBranch();
                console.log(`📌 Using default branch: ${defaultBranch}`);

                // Create the release
                const createResponse = await axios.post(
                    `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases`,
                    {
                        tag_name: tagName,
                        target_commitish: defaultBranch,
                        name: releaseName || tagName,
                        draft: isDraft,
                        prerelease: isPrerelease,
                        generate_release_notes: true
                    },
                    { headers: this.getHeaders() }
                );
                console.log(`✅ Release created successfully: ${tagName}`);
                return createResponse.data;
            }

            // Log the actual error
            console.error('❌ GitHub API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    }

    // ... rest of the methods remain the same ...
    async uploadAsset(releaseId, fileBuffer, fileName, contentType = 'application/vnd.android.package-archive') {
        try {
            const form = new FormData();
            form.append('file', fileBuffer, {
                filename: fileName,
                contentType: contentType
            });

            const response = await axios.post(
                `${this.uploadUrl}/repos/${this.owner}/${this.repo}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`,
                form,
                {
                    headers: {
                        ...this.getHeaders(),
                        ...form.getHeaders(),
                        'Content-Length': form.getLengthSync()
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            return response.data;
        } catch (error) {
            console.error('Upload error:', error.response?.data || error.message);
            throw error;
        }
    }

    async deleteAsset(assetId) {
        try {
            await axios.delete(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/assets/${assetId}`,
                { headers: this.getHeaders() }
            );
            return true;
        } catch (error) {
            console.error('Delete asset error:', error.response?.data || error.message);
            throw error;
        }
    }

    async deleteRelease(releaseId) {
        try {
            await axios.delete(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/${releaseId}`,
                { headers: this.getHeaders() }
            );
            return true;
        } catch (error) {
            console.error('Delete release error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getReleases() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get releases error:', error.response?.data || error.message);
            throw error;
        }
    }
    async getReleaseById(releaseId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/${releaseId}`,
                {
                    headers: this.getHeaders()
                }
            );

            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }

            console.error(
                'Get release by ID error:',
                error.response?.data || error.message
            );

            throw error;
        }
    }
    async getReleaseByTag(tagName) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/tags/${tagName}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Get release by tag error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getReleaseAssets(releaseId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/${releaseId}/assets`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Get assets error:', error.response?.data || error.message);
            throw error;
        }
    }

    // server/services/githubService.js

    // Publish a draft release
    async publishRelease(releaseId) {
        try {
            console.log(`📤 Publishing release ${releaseId}...`);
            const response = await axios.patch(
                `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/${releaseId}`,
                {
                    draft: false,
                    prerelease: false,
                    make_latest: 'true'
                },
                { headers: this.getHeaders() }
            );
            console.log(`✅ Release ${releaseId} published successfully!`);
            return response.data;
        } catch (error) {
            console.error('❌ Publish release error:', error.response?.data || error.message);
            throw error; // ✅ THROW the error, don't swallow it
        }
    }
}


module.exports = new GitHubService();