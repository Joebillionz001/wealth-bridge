/**
 * UI INTERACTIONS & INTERACTIVE COMPONENTS
 * Modals, dropdowns, tabs, notifications, and more
 */

export class UIInteractions {
    /**
     * MODAL MANAGEMENT
     */
    static initModals() {
        // Get all modal open buttons
        document.querySelectorAll('[data-modal-open]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = btn.dataset.modalOpen;
                this.openModal(modalId);
            });
        });

        // Get all modal close buttons
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('[data-modal]');
                if (modal) this.closeModal(modal.dataset.modal);
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('[data-modal]').forEach(modal => {
            const backdrop = modal.querySelector('[class*="backdrop"]') || modal;
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.closeModal(modal.dataset.modal);
                }
            });
        });

        // Keyboard: ESC to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('[data-modal].active').forEach(modal => {
                    this.closeModal(modal.dataset.modal);
                });
            }
        });
    }

    static openModal(modalId) {
        const modal = document.querySelector(`[data-modal="${modalId}"]`);
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.querySelector(`[data-modal="${modalId}"]`);
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * DROPDOWN MENU
     */
    static initDropdowns() {
        document.querySelectorAll('[data-dropdown]').forEach(trigger => {
            const dropdownId = trigger.dataset.dropdown;
            const dropdown = document.querySelector(`[data-dropdown-menu="${dropdownId}"]`);

            if (!dropdown) return;

            // Toggle dropdown on click
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
                trigger.classList.toggle('active');
            });

            // Close dropdown when clicking item
            dropdown.querySelectorAll('a, button').forEach(item => {
                item.addEventListener('click', () => {
                    dropdown.classList.remove('active');
                    trigger.classList.remove('active');
                });
            });
        });

        // Close all dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('[data-dropdown-menu]').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
            document.querySelectorAll('[data-dropdown]').forEach(trigger => {
                trigger.classList.remove('active');
            });
        });
    }

    /**
     * TABS/ACCORDION
     */
    static initTabs() {
        document.querySelectorAll('[data-tabs]').forEach(tabContainer => {
            const tabs = tabContainer.querySelectorAll('[data-tab]');
            const panels = tabContainer.querySelectorAll('[data-panel]');

            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Remove active from all tabs and panels
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));

                    // Add active to clicked tab and corresponding panel
                    tab.classList.add('active');
                    const panelId = tab.dataset.tab;
                    const panel = tabContainer.querySelector(`[data-panel="${panelId}"]`);
                    if (panel) panel.classList.add('active');
                });
            });
        });
    }

    /**
     * COLLAPSIBLE/ACCORDION
     */
    static initCollapsibles() {
        document.querySelectorAll('[data-collapsible]').forEach(item => {
            const trigger = item.querySelector('[data-collapsible-trigger]');
            const content = item.querySelector('[data-collapsible-content]');

            if (trigger && content) {
                trigger.addEventListener('click', () => {
                    item.classList.toggle('active');
                    content.style.display = item.classList.contains('active') ? 'block' : 'none';
                });
            }
        });

        // Also handle <details> elements
        document.querySelectorAll('details').forEach(details => {
            details.addEventListener('toggle', () => {
                const summary = details.querySelector('summary');
                if (summary && details.querySelector('[style*="border-top"]')) {
                    details.querySelector('[style*="border-top"]').style.paddingTop = 
                        details.open ? '1.5rem' : '0';
                }
            });
        });
    }

    /**
     * NOTIFICATION TOAST
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container') || (() => {
            const div = document.createElement('div');
            div.id = 'notification-container';
            div.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            document.body.appendChild(div);
            return div;
        })();

        const notification = document.createElement('div');
        const bgColor = {
            'success': '#d4edda',
            'error': '#f8d7da',
            'warning': '#fff3cd',
            'info': '#d1ecf1'
        };
        const textColor = {
            'success': '#155724',
            'error': '#721c24',
            'warning': '#856404',
            'info': '#0c5460'
        };
        const borderColor = {
            'success': '#c3e6cb',
            'error': '#f5c6cb',
            'warning': '#ffeeba',
            'info': '#bee5eb'
        };

        notification.style.cssText = `
            background: ${bgColor[type] || bgColor.info};
            color: ${textColor[type] || textColor.info};
            border: 1px solid ${borderColor[type] || borderColor.info};
            padding: 1rem 1.5rem;
            margin: 0.5rem 0;
            border-radius: 8px;
            animation: slideDown 0.3s ease;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * COPY TO CLIPBOARD
     */
    static initCopyButtons() {
        document.querySelectorAll('[data-copy]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const text = btn.dataset.copy;
                try {
                    await navigator.clipboard.writeText(text);
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copied!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 2000);
                    this.showNotification('Copied to clipboard!', 'success');
                } catch {
                    this.showNotification('Failed to copy', 'error');
                }
            });
        });

        // Also handle copy buttons inside inputs
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('Copy')) {
                btn.addEventListener('click', () => {
                    const input = btn.parentElement.querySelector('input');
                    if (input) {
                        navigator.clipboard.writeText(input.value);
                        btn.textContent = '✓ Copied!';
                        setTimeout(() => {
                            btn.textContent = 'Copy';
                        }, 2000);
                    }
                });
            }
        });
    }

    /**
     * TOGGLE VISIBILITY (Password show/hide)
     */
    static initPasswordToggles() {
        document.querySelectorAll('[data-toggle-password]').forEach(btn => {
            btn.addEventListener('click', () => {
                const inputId = btn.dataset.togglePassword;
                const input = document.getElementById(inputId);
                
                if (input) {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    btn.textContent = isPassword ? '🙈' : '👁️';
                }
            });
        });
    }

    /**
     * EXPANDABLE SECTIONS
     */
    static initExpandableSections() {
        document.querySelectorAll('[data-expandable]').forEach(section => {
            const trigger = section.querySelector('[data-expand-trigger]');
            const content = section.querySelector('[data-expand-content]');

            if (trigger && content) {
                trigger.style.cursor = 'pointer';
                trigger.addEventListener('click', () => {
                    const isOpen = section.classList.contains('expanded');
                    section.classList.toggle('expanded');
                    content.style.maxHeight = isOpen ? '0' : content.scrollHeight + 'px';
                });
            }
        });
    }

    /**
     * FORM FIELD FOCUS/BLUR EFFECTS
     */
    static initFormFocus() {
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('focus', () => {
                field.parentElement.classList?.add('focused');
            });
            field.addEventListener('blur', () => {
                field.parentElement.classList?.remove('focused');
                if (field.value) {
                    field.parentElement.classList?.add('filled');
                } else {
                    field.parentElement.classList?.remove('filled');
                }
            });
        });
    }

    /**
     * BUTTON RIPPLE EFFECT
     */
    static initRippleEffect() {
        document.querySelectorAll('button, a[class*="btn"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    animation: rippleOut 0.6s ease-out;
                    pointer-events: none;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    /**
     * SEARCH/FILTER
     */
    static initSearch() {
        document.querySelectorAll('[data-search]').forEach(searchInput => {
            const targetSelector = searchInput.dataset.search;
            const targetElements = document.querySelectorAll(targetSelector);

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();

                targetElements.forEach(el => {
                    const text = el.textContent.toLowerCase();
                    el.style.display = text.includes(query) ? '' : 'none';
                });
            });
        });
    }

    /**
     * SORT TABLES
     */
    static initSortableTables() {
        document.querySelectorAll('[data-sortable] th').forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const table = header.closest('[data-sortable]');
                const tbody = table.querySelector('tbody');
                const index = Array.from(header.parentElement.children).indexOf(header);
                const isAsc = header.classList.contains('asc');

                // Remove sort classes from all headers
                table.querySelectorAll('th').forEach(h => {
                    h.classList.remove('asc', 'desc');
                });

                // Add sort class to current header
                header.classList.add(isAsc ? 'desc' : 'asc');

                // Sort rows
                const rows = Array.from(tbody.querySelectorAll('tr'));
                rows.sort((a, b) => {
                    const aVal = a.children[index].textContent.trim();
                    const bVal = b.children[index].textContent.trim();
                    
                    const aNum = parseFloat(aVal);
                    const bNum = parseFloat(bVal);

                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return isAsc ? bNum - aNum : aNum - bNum;
                    }
                    
                    return isAsc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
                });

                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }

    /**
     * PAGINATION
     */
    static initPagination(itemsPerPage = 10) {
        document.querySelectorAll('[data-paginate]').forEach(table => {
            const tbody = table.querySelector('tbody');
            if (!tbody) return;

            const rows = Array.from(tbody.querySelectorAll('tr'));
            const totalPages = Math.ceil(rows.length / itemsPerPage);
            let currentPage = 1;

            const showPage = (page) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;

                rows.forEach((row, i) => {
                    row.style.display = (i >= start && i < end) ? '' : 'none';
                });

                // Update pagination buttons
                document.querySelectorAll('[data-pagination]').forEach(pag => {
                    pag.textContent = `Page ${page} of ${totalPages}`;
                });
            };

            // Pagination buttons
            document.querySelectorAll('[data-pagination-prev]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        showPage(currentPage);
                    }
                });
            });

            document.querySelectorAll('[data-pagination-next]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        showPage(currentPage);
                    }
                });
            });

            showPage(1);
        });
    }

    /**
     * INITIALIZE ALL
     */
    static initAll() {
        this.initModals();
        this.initDropdowns();
        this.initTabs();
        this.initCollapsibles();
        this.initCopyButtons();
        this.initPasswordToggles();
        this.initExpandableSections();
        this.initFormFocus();
        this.initRippleEffect();
        this.initSearch();
        this.initSortableTables();
        this.initPagination();
    }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UIInteractions.initAll());
} else {
    UIInteractions.initAll();
}
