(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var widget = document.getElementById('chatlink-widget');
        var btn = document.getElementById('chatlink-btn');
        var chat = document.getElementById('chatlink-chat');
        var chatBody = document.getElementById('chatlink-chat-body');
        var faqSection = document.getElementById('chatlink-faq-section');
        var data = window.chatlinkData || {};
        var faqs = data.faqs || [];
        
        if (!widget || !btn) return;
        
        // ====== 1. Toggle Chat Popup ======
        if (chat) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var isOpen = widget.classList.contains('chatlink-open');
                
                if (isOpen) {
                    closeChat();
                } else {
                    openChat();
                }
            });
            
            // Close Button
            var closeBtn = chat.querySelector('.chatlink-chat-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeChat();
                });
            }
            
            // Close on Outside Click
            document.addEventListener('click', function(e) {
                if (!widget.contains(e.target) && widget.classList.contains('chatlink-open')) {
                    closeChat();
                }
            });
            
            // Prevent clicks inside chat from closing it
            chat.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            // ====== 2. FAQ Click Logic ======
            if (faqSection) {
                faqSection.addEventListener('click', function(e) {
                    if (e.target.classList.contains('chatlink-faq-btn')) {
                        e.preventDefault();
                        var index = parseInt(e.target.getAttribute('data-faq-index'), 10);
                        if (!isNaN(index) && faqs[index]) {
                            handleFaqSelection(faqs[index].question, faqs[index].answer);
                        }
                    }
                });
            }
            
            // ====== 3. Start Chat Button ======
            var startChatBtn = chat.querySelector('.chatlink-start-chat');
            if (startChatBtn) {
                startChatBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    var phone = data.phone || '';
                    var message = data.message || '';
                    
                    if (!phone) {
                        console.error('ChatLink: Phone number not configured');
                        return;
                    }
                    
                    var url = 'https://wa.me/' + phone;
                    if (message) {
                        url += '?text=' + encodeURIComponent(message);
                    }
                    
                    window.open(url, '_blank', 'noopener,noreferrer');
                });
            }
        }
        
        // ====== Helper Functions ======
        function openChat() {
            widget.classList.add('chatlink-open');
            chat.style.display = 'flex';
            scrollToBottom();
        }
        
        function closeChat() {
            widget.classList.remove('chatlink-open');
            chat.style.display = 'none';
        }
        
        function handleFaqSelection(question, answer) {
            if (!question || !answer || !chatBody) return;
            
            // Remove FAQ section temporarily
            if (faqSection && faqSection.parentNode) {
                faqSection.parentNode.removeChild(faqSection);
            }
            
            // User Bubble
            var userBubble = document.createElement('div');
            userBubble.className = 'chatlink-chat-bubble chatlink-bubble-sent';
            userBubble.innerHTML = '<div class="chatlink-bubble-text">' + escapeHtml(question) + '</div>' +
                                   '<span class="chatlink-chat-time">' + getCurrentTime() + '</span>';
            chatBody.appendChild(userBubble);
            
            scrollToBottom();
            
            // Bot Reply (Delayed for natural feel)
            setTimeout(function() {
                var botBubble = document.createElement('div');
                botBubble.className = 'chatlink-chat-bubble chatlink-bubble-received';
                botBubble.innerHTML = '<div class="chatlink-bubble-text">' + 
                                      escapeHtml(answer).replace(/\n/g, '<br>') + 
                                      '</div><span class="chatlink-chat-time">' + getCurrentTime() + '</span>';
                chatBody.appendChild(botBubble);
                
                // Re-append FAQ section at bottom
                if (faqSection) {
                    chatBody.appendChild(faqSection);
                }
                
                scrollToBottom();
            }, 600);
        }
        
        function scrollToBottom() {
            if (chatBody) {
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        }
        
        function getCurrentTime() {
            var now = new Date();
            return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        
        function escapeHtml(text) {
            if (typeof text !== 'string') return '';
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, function(m) { return map[m]; });
        }
        
        // ====== 4. WooCommerce Inquiry Button Logic ======
        var inquiryButtons = document.querySelectorAll('.chatlink-inquiry-btn');
        
        inquiryButtons.forEach(function(inquiryBtn) {
            inquiryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Parse inquiry data
                var dataAttr = this.getAttribute('data-chatlink-inquiry');
                if (!dataAttr) {
                    console.error('ChatLink: Missing inquiry data');
                    return;
                }
                
                var d;
                try {
                    d = JSON.parse(dataAttr);
                } catch (err) {
                    console.error('ChatLink: Invalid JSON in data-chatlink-inquiry', err);
                    return;
                }
                
                if (!d.phone) {
                    console.error('ChatLink: Phone number missing in inquiry data');
                    return;
                }
                
                var productId = this.getAttribute('data-product-id') || '';
                var qty = 1;
                
                // Priority 1: WooCommerce default quantity input (name="quantity")
                var defaultQtyInput = document.querySelector('input[name="quantity"]');
                
                // Priority 2: Our custom quantity input (id="chatlink-qty-{product_id}")
                var customQtyInput = productId ? document.getElementById('chatlink-qty-' + productId) : null;
                
                // Priority 3: Loop/Archive quantity input (closest to button)
                var closestQtyInput = this.closest('.chatlink-inquiry-wrap') 
                    ? this.closest('.chatlink-inquiry-wrap').querySelector('.chatlink-qty-input') 
                    : null;
                
                // Get quantity from first available input
                if (defaultQtyInput && defaultQtyInput.value) {
                    qty = parseInt(defaultQtyInput.value, 10) || 1;
                } else if (customQtyInput && customQtyInput.value) {
                    qty = parseInt(customQtyInput.value, 10) || 1;
                } else if (closestQtyInput && closestQtyInput.value) {
                    qty = parseInt(closestQtyInput.value, 10) || 1;
                }
                
                // Ensure quantity is valid
                qty = Math.max(1, qty);
                
                // Build message from template
                var msg = (d.template || '')
                    .replace(/{product}/g, d.product || '')
                    .replace(/{price}/g, d.price || '')
                    .replace(/{quantity}/g, qty)
                    .replace(/{url}/g, d.url || '')
                    .replace(/{site}/g, d.site || '');
                
                // Build WhatsApp URL
                var url = 'https://wa.me/' + d.phone;
                if (msg.trim()) {
                    url += '?text=' + encodeURIComponent(msg);
                }
                
                // Open WhatsApp in new tab
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        });
    });
})();
