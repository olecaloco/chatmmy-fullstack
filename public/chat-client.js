/**
 * Fetches 7TV emotes based on the set id
 * 
 * @param {string} emoteSetId 
 * @returns Promise
 */
async function fetch7TVEmotes(emoteSetId) {
    return fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`)
        .then(data => data.json());
}

/**
 * Fetches logged in user's data
 * 
 * @returns Promise
 */
async function fetchUserData() {
    return fetch("/auth/me")
        .then(data => data.json());
}

/**
 * Fetches initial chat messages. Limit is controlled in the backend.
 * 
 * @returns Promise
 */
async function fetchChatMessages() {
    return fetch("/chat")
        .then(data => data.json());
}

/**
 * Checks if the string is a valid url
 * 
 * @param {string} url 
 * @returns boolean
 */
function isValidHttpUrl(url) {
    try {
        const newUrl = new URL(url);
        return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
    } catch (err) {
        return false;
    }
}

document.addEventListener('alpine:init', () => {
    const MESSAGES_LIMIT = 50;    

    Alpine.data('app', () => ({
        appName: 'Chatmmy',
        user: null,
        message: "",
        messages: [],
        emotes: {},
        suggestedEmotes: [],
        socket: null,

        async init() {
            
            fetch7TVEmotes("01J54EKGP80009G53SSQGW5BK4")
                .then((response) => {
                    response.emotes.forEach((emote, _) => {
                        this.emotes[emote.name] = emote.data.host.url;
                    });
                })
                .catch((error) => {
                    console.error(error)
                });

            await fetchUserData()
                .then(response => this.user = response.user)
                .catch(error => console.error(error));
            
            fetchChatMessages()
                .then(response => {
                    this.messages = [...response.result].reverse();
                })
                .catch(error => console.error(error));

            this.socket = io();
            this.socket.on("message", this.onMessageReceive.bind(this));
        },

        parseMessage(message) {
            const tokens = message.message.split(/ /g);
            const emoteSize = tokens.length === 1 ? '2x.webp' : '1x.webp';
            
            const msg = tokens.map((token) => {
                if (!this.emotes[token]) {
                    if (isValidHttpUrl(token)) {
                        return `<a href="${token}">${token}</a>`;
                    }
                    
                    return token
                };
        
                return `<img src="${this.emotes[token]}/${emoteSize}" alt="${token}" />`;
            }).join(" ");
        
            return msg;
        },

        onMessageReceive(serverMessage) {
            if (this.messages.length >= MESSAGES_LIMIT) {
                const recentMessages = this.messages.slice(-MESSAGES_LIMIT + 1);
                this.messages = [...recentMessages, serverMessage];
            } else {
                this.messages.push(serverMessage);
            }

            this.$nextTick(() => {
                this.$refs.message.scrollTo(0, this.$refs.message.scrollHeight);
            })
        },

        userOwnsMessage(message) {
            if (!this.user) return false;
            if (message.userId === this.user.id) return true;
            return false;
        },

        checkEmoteSuggestions() {     
            if (!this.message) {
                this.suggestedEmotes = [];
                return;
            };

            const tokens = this.message.split(/ /g);
            const last = tokens[tokens.length - 1];
            
            if (!last.startsWith(':') || last === ":") {
                this.suggestedEmotes = [];
                return
            };

            if (Object.keys(this.emotes).length === 0) {
                this.suggestedEmotes = [];
                return;
            };

            const emoteKey = last.replace(':', '').toLowerCase();
            
            const suggestedKeys = Object.keys(this.emotes).filter((key) => {
                return key.toLowerCase().includes(emoteKey);
            });

            this.suggestedEmotes = suggestedKeys.map(key => ({ name: key, url: `${this.emotes[key]}/1x.webp` }));
        },

        onSuggestionClick(emoteName) {
            const tokens = this.message.split(/ /g);
            
            this.message = tokens.map(token => {
                if (!token.startsWith(':')) return token;

                return emoteName;
            }).join(' ') + " ";

            this.suggestedEmotes = [];
            this.$refs.input.focus();
        },

        onFormSubmit() {
            if (!this.message) return;
            

            // Autocomplete the emote suggestion if there's any
            if (this.suggestedEmotes.length > 0) {
                this.suggestedEmotes[0].name;
                this.message = this.message.split(/ /g).map(t => {
                    if (!t.startsWith(':')) return t;
                    return this.suggestedEmotes[0].name
                }).join(' ');

                this.suggestedEmotes = [];
                return;
            }

            // TODO: Save to database first
            fetch('/chat/create', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: this.message,
                    userId: this.user.id
                })
            })
                .then((data) => data.json())
                .then((response) => console.log(response))
                .catch(error => console.error(error));

            // Sends the message to the socket
            this.socket.emit('message', {
                message: this.message,
                userId: this.user.id
            });

            // Resets
            this.suggestedEmotes = [];
            this.message = '';
        }
    }));
});
