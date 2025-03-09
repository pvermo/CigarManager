/**
 * Module Produits - Le Diplomate
 * Version corrigée pour résoudre les problèmes de modales
 */

// Initialiser le module des produits
LeDiplomate.produits = {
    // Variables du module
    currentPage: 1,
    itemsPerPage: 10,
    currentItems: [],
    filteredItems: [],
    
    /**
     * Initialise le module
     */
    init: function() {
        console.log('Initialisation du module Produits');
        
        // Initialiser les gestionnaires d'événements
        this.initEventListeners();
        
        // Charger les données de produits
        this.loadProductsData();
        
        // Calculer et afficher le montant total du stock
        this.calculateTotalStockValue();
    },
    
    /**
     * Initialise les gestionnaires d'événements
     */
    initEventListeners: function() {
        console.log('Initialisation des événements du module Produits');
        
        // Recherche
        const searchInput = document.getElementById('product-catalog-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.searchProducts.bind(this), 300));
        }
        
        const searchBtn = document.getElementById('product-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.searchProducts.bind(this));
        }
        
        // Actions CRUD
        const addProductBtn = document.getElementById('add-product-item');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', this.showAddProductModal.bind(this));
        }
        
        const importProductsBtn = document.getElementById('import-products');
        if (importProductsBtn) {
            importProductsBtn.addEventListener('click', this.importProductsExcel.bind(this));
        }
        
        const exportProductsBtn = document.getElementById('export-products');
        if (exportProductsBtn) {
            exportProductsBtn.addEventListener('click', this.exportProductsExcel.bind(this));
        }
        
        // Bouton de réinitialisation
        const resetProductsBtn = document.getElementById('reset-products');
        if (resetProductsBtn) {
            resetProductsBtn.addEventListener('click', this.showResetConfirmation.bind(this, 'products'));
        }
        
        // Ajouter un bouton de réinitialisation du stock si nécessaire
        const resetStockBtn = document.getElementById('reset-stock');
        if (resetStockBtn) {
            resetStockBtn.addEventListener('click', this.showResetConfirmation.bind(this, 'stock'));
        }
        
        // Délégation d'événements pour les actions sur les produits
        const productItems = document.getElementById('product-items');
        if (productItems) {
            productItems.addEventListener('click', e => {
                const target = e.target;
                const row = target.closest('tr');
                
                if (!row) return;
                
                const productId = row.dataset.id;
                if (!productId) return;
                
                if (target.classList.contains('edit-product') || target.closest('.edit-product')) {
                    this.editProductItem(productId);
                } else if (target.classList.contains('delete-product') || target.closest('.delete-product')) {
                    this.deleteProductItem(productId);
                } else if (target.classList.contains('adjust-stock') || target.closest('.adjust-stock')) {
                    this.showAdjustStockModal(productId);
                }
            });
        }
        
        // Gestionnaires d'événements pour les formulaires
        document.addEventListener('submit', e => {
            if (e.target.id === 'product-form') {
                e.preventDefault();
                this.saveProductItem();
            } else if (e.target.id === 'adjust-stock-form') {
                e.preventDefault();
                this.saveStockAdjustment();
            }
        });
    },
    
    /**
     * Calcule et affiche le montant total du stock
     */
    calculateTotalStockValue: function() {
        let totalValue = 0;
        let totalItems = 0;
        
        // Calculer la valeur totale du stock
        this.currentItems.forEach(item => {
            if (item.quantity > 0 && item.price) {
                totalValue += item.quantity * item.price;
                totalItems += item.quantity;
            }
        });
        
        // Vérifier si l'élément d'affichage du total existe, sinon le créer
        let totalValueDisplay = document.getElementById('products-total-value');
        
        if (!totalValueDisplay) {
            // Créer l'élément pour afficher le total
            const stockContainer = document.querySelector('.products-table-container');
            if (stockContainer) {
                totalValueDisplay = document.createElement('div');
                totalValueDisplay.id = 'products-total-value';
                totalValueDisplay.className = 'stock-total-value';
                
                stockContainer.parentNode.insertBefore(totalValueDisplay, stockContainer.nextSibling);
            }
        }
        
        // Mettre à jour l'affichage du total
        if (totalValueDisplay) {
            totalValueDisplay.textContent = `Valeur totale du stock: ${LeDiplomate.formatPrice(totalValue)}€ (${totalItems} articles)`;
            
            // Ajouter une animation pour indiquer la mise à jour
            totalValueDisplay.classList.add('updated');
            setTimeout(() => {
                totalValueDisplay.classList.remove('updated');
            }, 1500);
        }
    },
    
    /**
     * Charge les données de produits avec stock intégré
     */
    loadProductsData: function() {
        // Récupérer les données de produits et stock
        const products = LeDiplomate.dataManager.products.getAll();
        const stockItems = LeDiplomate.dataManager.stock.getAll();
        const suppliers = LeDiplomate.dataManager.suppliers.getAll();
        
        // Créer un mapping des fournisseurs par ID pour un accès plus rapide
        const suppliersMap = {};
        suppliers.forEach(supplier => {
            suppliersMap[supplier.id] = supplier;
        });
        
        // Créer un mapping du stock par productId pour un accès plus rapide
        const stockMap = {};
        stockItems.forEach(item => {
            stockMap[item.productId] = item;
        });
        
        // Fusionner les données
        this.currentItems = products.map(product => {
            // Trouver l'information de stock correspondante
            const stockItem = stockMap[product.id];
            
            // Trouver le fournisseur
            let supplier = null;
            if (stockItem && stockItem.supplierId) {
                supplier = suppliersMap[stockItem.supplierId];
            }
            
            // Créer un objet produit enrichi
            return {
                ...product,
                quantity: stockItem ? stockItem.quantity : 0,
                price: stockItem ? stockItem.price : 0,
                supplierId: stockItem ? stockItem.supplierId : null,
                supplierName: supplier ? supplier.name : null,
                stockId: stockItem ? stockItem.id : null
            };
        });
        
        this.filteredItems = [...this.currentItems];
        
        // Réinitialiser la pagination à la première page
        this.currentPage = 1;
        
        // Afficher les données
        this.renderProductsTable();
    },
    
    /**
     * Affiche le tableau de produits avec le stock intégré
     */
    renderProductsTable: function() {
        const tableBody = document.getElementById('product-items');
        if (!tableBody) {
            console.error('Élément #product-items non trouvé');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (this.filteredItems.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="12" class="text-center">Aucun produit trouvé</td>';
            tableBody.appendChild(row);
            
            // Masquer la pagination
            const paginationElement = document.getElementById('products-pagination');
            if (paginationElement) {
                paginationElement.innerHTML = '';
            }
            return;
        }
        
        // Calculer la pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredItems.length);
        const paginatedItems = this.filteredItems.slice(startIndex, endIndex);
        
        // Afficher les produits
        paginatedItems.forEach(product => {
            const row = document.createElement('tr');
            row.dataset.id = product.id;
            
            row.innerHTML = `
                <td>${product.brand || '--'}</td>
                <td>${product.name || '--'}</td>
                <td>${product.country || '--'}</td>
                <td>${product.vitole || '--'}</td>
                <td>${product.wrapper || '--'}</td>
                <td>${product.binder || '--'}</td>
                <td>${product.filler || '--'}</td>
                <td>${product.strength || '--'}</td>
                <td class="${product.quantity <= 3 ? 'text-danger fw-bold' : ''}">${product.quantity || 0}</td>
                <td>${product.price ? LeDiplomate.formatPrice(product.price) + '€' : '--'}</td>
                <td>${product.supplierName || '--'}</td>
                <td>
                    <button class="action-btn adjust-stock" title="Ajuster le stock">📦</button>
                    <button class="action-btn edit-product" title="Modifier">✎</button>
                    <button class="action-btn delete-product" title="Supprimer">✕</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Mettre à jour la pagination
        this.renderPagination();
        
        // Recalculer le total
        this.calculateTotalStockValue();
    },
    
    /**
     * Affiche les contrôles de pagination
     */
    renderPagination: function() {
        const paginationContainer = document.getElementById('products-pagination');
        if (!paginationContainer) {
            console.error('Élément #products-pagination non trouvé');
            return;
        }
        
        paginationContainer.innerHTML = '';
        
        if (this.filteredItems.length <= this.itemsPerPage) {
            return;
        }
        
        const pageCount = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        
        // Bouton précédent
        if (this.currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = '←';
            prevButton.addEventListener('click', () => {
                this.currentPage--;
                this.renderProductsTable();
            });
            paginationContainer.appendChild(prevButton);
        }
        
        // Pages
        for (let i = 1; i <= pageCount; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === this.currentPage);
            
            pageButton.addEventListener('click', () => {
                this.currentPage = i;
                this.renderProductsTable();
            });
            
            paginationContainer.appendChild(pageButton);
        }
        
        // Bouton suivant
        if (this.currentPage < pageCount) {
            const nextButton = document.createElement('button');
            nextButton.textContent = '→';
            nextButton.addEventListener('click', () => {
                this.currentPage++;
                this.renderProductsTable();
            });
            paginationContainer.appendChild(nextButton);
        }
    },
    
    /**
     * Recherche dans les produits
     */
    searchProducts: function() {
        const searchInput = document.getElementById('product-catalog-search');
        if (!searchInput) {
            console.error('Élément de recherche produit non trouvé');
            return;
        }
        
        const query = searchInput.value.trim().toLowerCase();
        
        if (query === '') {
            // Réinitialiser la recherche
            this.filteredItems = [...this.currentItems];
        } else {
            // Appliquer la recherche sur tous les champs pertinents
            this.filteredItems = this.currentItems.filter(product => {
                return (
                    (product.brand && product.brand.toLowerCase().includes(query)) ||
                    (product.name && product.name.toLowerCase().includes(query)) ||
                    (product.country && product.country.toLowerCase().includes(query)) ||
                    (product.vitole && product.vitole.toLowerCase().includes(query)) ||
                    (product.supplierName && product.supplierName.toLowerCase().includes(query))
                );
            });
        }
        
        // Réinitialiser la pagination
        this.currentPage = 1;
        
        // Mettre à jour l'affichage
        this.renderProductsTable();
    },
    
    /**
     * Affiche la modale d'ajout de produit
     * CORRIGÉ pour utiliser le template existant
     */
    showAddProductModal: function() {
        // Utiliser la modale existante
        LeDiplomate.modals.show('tpl-modal-product-form');
        
        // Attendre que la modale soit affichée avant de manipuler les éléments
        setTimeout(() => {
            // Réinitialiser le formulaire
            const idField = document.getElementById('product-id');
            if (idField) idField.value = '';
            
            const brandField = document.getElementById('product-brand');
            if (brandField) brandField.value = '';
            
            const nameField = document.getElementById('product-name');
            if (nameField) nameField.value = '';
            
            const countryField = document.getElementById('product-country');
            if (countryField) countryField.value = '';
            
            const vitoleField = document.getElementById('product-vitole');
            if (vitoleField) vitoleField.value = '';
            
            const wrapperField = document.getElementById('product-wrapper');
            if (wrapperField) wrapperField.value = '';
            
            const binderField = document.getElementById('product-binder');
            if (binderField) binderField.value = '';
            
            const fillerField = document.getElementById('product-filler');
            if (fillerField) fillerField.value = '';
            
            const strengthField = document.getElementById('product-strength');
            if (strengthField) strengthField.value = 'Moyenne';
            
            // Ajouter dynamiquement les champs de stock
            this.addStockFieldsToForm();
        }, 100);
    },
    
    /**
     * Ajoute les champs de stock au formulaire de produit
     */
    addStockFieldsToForm: function() {
        // Supprimer les champs existants si présents
        const existingFields = document.getElementById('product-stock-fields');
        if (existingFields) existingFields.innerHTML = '';
        
        // Générer les options pour le sélecteur de fournisseurs
        const supplierOptions = LeDiplomate.dataManager.suppliers.getAll().map(supplier => 
            `<option value="${supplier.id}">${supplier.name}</option>`
        ).join('');
        
        if (existingFields) {
            existingFields.innerHTML = `
                <div class="form-group">
                    <label for="product-stock">Quantité en stock:</label>
                    <input type="number" id="product-stock" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="product-price">Prix de vente (€):</label>
                    <input type="number" id="product-price" min="0" step="0.01" value="0.00">
                </div>
                <div class="form-group">
                    <label for="product-supplier">Fournisseur:</label>
                    <select id="product-supplier">
                        <option value="">Sélectionnez un fournisseur</option>
                        ${supplierOptions}
                    </select>
                </div>
            `;
        }
    },
    
    /**
     * Affiche la modale de modification de produit
     * CORRIGÉ pour utiliser le template existant
     * @param {string} productId - ID du produit à modifier
     */
    editProductItem: function(productId) {
        try {
            // Récupérer le produit
            const product = this.currentItems.find(p => p.id === productId);
            if (!product) {
                console.error('Produit non trouvé:', productId);
                return;
            }
            
            // Afficher la modale
            LeDiplomate.modals.show('tpl-modal-product-form');
            
            // Attendre que la modale soit affichée avant de manipuler les éléments
            setTimeout(() => {
                // Remplir le formulaire avec les données du produit
                const idField = document.getElementById('product-id');
                if (idField) idField.value = product.id;
                
                const brandField = document.getElementById('product-brand');
                if (brandField) brandField.value = product.brand || '';
                
                const nameField = document.getElementById('product-name');
                if (nameField) nameField.value = product.name || '';
                
                const countryField = document.getElementById('product-country');
                if (countryField) countryField.value = product.country || '';
                
                const vitoleField = document.getElementById('product-vitole');
                if (vitoleField) vitoleField.value = product.vitole || '';
                
                const wrapperField = document.getElementById('product-wrapper');
                if (wrapperField) wrapperField.value = product.wrapper || '';
                
                const binderField = document.getElementById('product-binder');
                if (binderField) binderField.value = product.binder || '';
                
                const fillerField = document.getElementById('product-filler');
                if (fillerField) fillerField.value = product.filler || '';
                
                const strengthField = document.getElementById('product-strength');
                if (strengthField) strengthField.value = product.strength || 'Moyenne';
                
                // Ajouter les champs de stock
                this.addStockFieldsToForm();
                
                // Remplir les champs de stock
                const stockField = document.getElementById('product-stock');
                if (stockField) stockField.value = product.quantity || 0;
                
                const priceField = document.getElementById('product-price');
                if (priceField) priceField.value = product.price || 0;
                
                const supplierField = document.getElementById('product-supplier');
                if (supplierField && product.supplierId) {
                    supplierField.value = product.supplierId;
                }
            }, 100);
        } catch (error) {
            console.error('Erreur lors de la modification du produit:', error);
            LeDiplomate.notifications.show('Erreur lors de la modification du produit: ' + error.message, 'error');
        }
    },
    
    /**
     * Affiche la modale d'ajustement du stock
     * CORRIGÉ pour créer et utiliser un template temporaire
     * @param {string} productId - ID du produit à ajuster
     */
    showAdjustStockModal: function(productId) {
        try {
            // Récupérer le produit
            const product = this.currentItems.find(p => p.id === productId);
            if (!product) {
                console.error('Produit non trouvé:', productId);
                return;
            }
            
            // Générer les options pour le sélecteur de fournisseurs
            const supplierOptions = LeDiplomate.dataManager.suppliers.getAll().map(supplier => 
                `<option value="${supplier.id}" ${product.supplierId === supplier.id ? 'selected' : ''}>${supplier.name}</option>`
            ).join('');
            
            // Créer un template temporaire pour l'ajustement du stock
            const tempId = 'tpl-temp-adjust-stock';
            
            // Vérifier si le template existe déjà
            let tempTemplate = document.getElementById(tempId);
            if (!tempTemplate) {
                // Créer le template s'il n'existe pas
                tempTemplate = document.createElement('template');
                tempTemplate.id = tempId;
                document.body.appendChild(tempTemplate);
            }
            
            // Définir le contenu du template
            tempTemplate.innerHTML = `
                <h3>Ajuster le stock - ${product.brand} ${product.name}</h3>
                <form id="adjust-stock-form">
                    <input type="hidden" id="adjust-product-id" value="${product.id}">
                    <input type="hidden" id="adjust-stock-id" value="${product.stockId || ''}">
                    
                    <div class="form-group">
                        <label for="current-stock">Stock actuel:</label>
                        <input type="text" id="current-stock" value="${product.quantity || 0}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label for="stock-adjustment">Ajustement:</label>
                        <div class="stock-adjustment-controls">
                            <button type="button" class="btn secondary" id="decrease-stock">-</button>
                            <input type="number" id="stock-adjustment" value="0">
                            <button type="button" class="btn secondary" id="increase-stock">+</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="new-stock-value">Nouvelle valeur:</label>
                        <input type="number" id="new-stock-value" min="0" value="${product.quantity || 0}">
                    </div>
                    
                    <div class="form-group">
                        <label for="adjust-price">Prix de vente (€):</label>
                        <input type="number" id="adjust-price" min="0" step="0.01" value="${product.price || 0}">
                    </div>
                    
                    <div class="form-group">
                        <label for="adjust-supplier">Fournisseur:</label>
                        <select id="adjust-supplier" required>
                            <option value="">Sélectionnez un fournisseur</option>
                            ${supplierOptions}
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn primary">Enregistrer</button>
                        <button type="button" class="btn secondary close-modal">Annuler</button>
                    </div>
                </form>
            `;
            
            // Afficher la modale avec ce template
            LeDiplomate.modals.show(tempId);
            
            // Ajouter les événements après l'affichage de la modale
            setTimeout(() => {
                // Gérer les boutons d'ajustement
                const decreaseBtn = document.getElementById('decrease-stock');
                const increaseBtn = document.getElementById('increase-stock');
                const adjustmentInput = document.getElementById('stock-adjustment');
                const newValueInput = document.getElementById('new-stock-value');
                
                // Synchroniser l'ajustement et la nouvelle valeur
                const updateNewValue = () => {
                    const currentStock = parseInt(document.getElementById('current-stock').value) || 0;
                    const adjustment = parseInt(adjustmentInput.value) || 0;
                    newValueInput.value = Math.max(0, currentStock + adjustment);
                };
                
                const updateAdjustment = () => {
                    const currentStock = parseInt(document.getElementById('current-stock').value) || 0;
                    const newValue = parseInt(newValueInput.value) || 0;
                    adjustmentInput.value = newValue - currentStock;
                };
                
                if (decreaseBtn) {
                    decreaseBtn.addEventListener('click', () => {
                        adjustmentInput.value = parseInt(adjustmentInput.value || 0) - 1;
                        updateNewValue();
                    });
                }
                
                if (increaseBtn) {
                    increaseBtn.addEventListener('click', () => {
                        adjustmentInput.value = parseInt(adjustmentInput.value || 0) + 1;
                        updateNewValue();
                    });
                }
                
                if (adjustmentInput) {
                    adjustmentInput.addEventListener('input', updateNewValue);
                }
                
                if (newValueInput) {
                    newValueInput.addEventListener('input', updateAdjustment);
                }
            }, 100);
        } catch (error) {
            console.error('Erreur lors de l\'affichage de la modale d\'ajustement du stock:', error);
            LeDiplomate.notifications.show('Erreur lors de l\'ajustement du stock: ' + error.message, 'error');
        }
    },
    
    /**
     * Enregistre l'ajustement du stock
     */
    saveStockAdjustment: function() {
        try {
            const productId = document.getElementById('adjust-product-id').value;
            const stockId = document.getElementById('adjust-stock-id').value;
            const newStockValue = parseInt(document.getElementById('new-stock-value').value) || 0;
            const price = parseFloat(document.getElementById('adjust-price').value) || 0;
            const supplierId = document.getElementById('adjust-supplier').value;
            
            // Valider les données
            if (newStockValue < 0) {
                LeDiplomate.notifications.show('La quantité en stock ne peut pas être négative', 'error');
                return;
            }
            
            if (price < 0) {
                LeDiplomate.notifications.show('Le prix ne peut pas être négatif', 'error');
                return;
            }
            
            if (!supplierId) {
                LeDiplomate.notifications.show('Veuillez sélectionner un fournisseur', 'error');
                return;
            }
            
            // Préparer l'objet stock
            const stockItem = {
                productId,
                quantity: newStockValue,
                price,
                supplierId
            };
            
            // Créer ou mettre à jour l'élément de stock
            if (stockId) {
                stockItem.id = stockId;
                LeDiplomate.dataManager.stock.update(stockItem);
            } else {
                LeDiplomate.dataManager.stock.add(stockItem);
            }
            
            // Fermer la modale
            LeDiplomate.modals.hide();
            
            // Notification de succès
            LeDiplomate.notifications.show('Stock mis à jour avec succès', 'success');
            
            // Recharger les données
            this.loadProductsData();
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'ajustement du stock:', error);
            LeDiplomate.notifications.show('Erreur lors de la mise à jour du stock: ' + error.message, 'error');
        }
    },
    
    /**
     * Enregistre un produit (ajout ou modification)
     */
    saveProductItem: function() {
        try {
            // Récupérer les données du formulaire
            const productId = document.getElementById('product-id').value;
            const brand = document.getElementById('product-brand').value.trim();
            const name = document.getElementById('product-name').value.trim();
            const country = document.getElementById('product-country').value.trim();
            const vitole = document.getElementById('product-vitole').value.trim();
            const wrapper = document.getElementById('product-wrapper').value.trim();
            const binder = document.getElementById('product-binder').value.trim();
            const filler = document.getElementById('product-filler').value.trim();
            const strength = document.getElementById('product-strength').value;
            
            // Récupérer les données de stock
            const quantity = parseInt(document.getElementById('product-stock').value) || 0;
            const price = parseFloat(document.getElementById('product-price').value) || 0;
            const supplierId = document.getElementById('product-supplier').value;
            
            // Valider les données
            if (!brand || !name) {
                LeDiplomate.notifications.show('La marque et le nom du produit sont obligatoires', 'error');
                return;
            }
            
            if (quantity > 0) {
                if (price <= 0) {
                    LeDiplomate.notifications.show('Veuillez saisir un prix valide pour le stock', 'error');
                    return;
                }
                
                if (!supplierId) {
                    LeDiplomate.notifications.show('Veuillez sélectionner un fournisseur pour le stock', 'error');
                    return;
                }
            }
            
            // Préparer l'objet produit
            const product = {
                brand,
                name,
                country,
                vitole,
                wrapper,
                binder,
                filler,
                strength
            };
            
            // Enregistrer le produit (ajout ou modification)
            if (productId) {
                product.id = productId;
                LeDiplomate.dataManager.products.update(product);
            } else {
                const newProduct = LeDiplomate.dataManager.products.add(product);
                product.id = newProduct.id;
            }
            
            // Gérer le stock si nécessaire
            if (quantity > 0 || price > 0) {
                const existingStock = LeDiplomate.dataManager.stock.getByProductId(product.id);
                
                if (existingStock) {
                    // Mettre à jour le stock existant
                    existingStock.quantity = quantity;
                    existingStock.price = price;
                    existingStock.supplierId = supplierId;
                    LeDiplomate.dataManager.stock.update(existingStock);
                } else {
                    // Créer un nouvel élément de stock
                    LeDiplomate.dataManager.stock.add({
                        productId: product.id,
                        quantity: quantity,
                        price: price,
                        supplierId: supplierId
                    });
                }
            }
            
            // Fermer la modale
            LeDiplomate.modals.hide();
            
            // Notification de succès
            LeDiplomate.notifications.show(productId ? 'Produit mis à jour avec succès' : 'Produit ajouté avec succès', 'success');
            
            // Recharger les données
            this.loadProductsData();
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du produit:', error);
            LeDiplomate.notifications.show('Erreur lors de l\'enregistrement du produit: ' + error.message, 'error');
        }
    },
    
    /**
     * Supprime un produit
     * @param {string} productId - ID du produit à supprimer
     */
    deleteProductItem: function(productId) {
        try {
            // Récupérer le produit
            const product = this.currentItems.find(p => p.id === productId);
            if (!product) {
                console.error('Produit non trouvé:', productId);
                return;
            }
            
            // Vérifier si le produit est en stock
            if (product.quantity > 0) {
                LeDiplomate.notifications.show('Impossible de supprimer un produit en stock. Veuillez d\'abord réduire son stock à zéro.', 'error');
                return;
            }
            
            // Demander confirmation
            if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit ${product.brand} ${product.name} ?`)) {
                return;
            }
            
            // Supprimer le produit du catalogue
            LeDiplomate.dataManager.products.delete(productId);
            
            // Supprimer également l'élément de stock associé si existant
            if (product.stockId) {
                LeDiplomate.dataManager.stock.delete(product.stockId);
            }
            
            // Notification de succès
            LeDiplomate.notifications.show('Produit supprimé avec succès', 'success');
            
            // Recharger les données
            this.loadProductsData();
        } catch (error) {
            console.error('Erreur lors de la suppression du produit:', error);
            LeDiplomate.notifications.show('Erreur lors de la suppression du produit: ' + error.message, 'error');
        }
    },
    /**
     * Affiche la confirmation de réinitialisation du stock ou du catalogue
     * @param {string} type - Type de réinitialisation ('stock' ou 'products')
     */
    showResetConfirmation: function(type) {
        try {
            // Définir le message approprié selon le type
            let message = '';
            
            if (type === 'stock') {
                message = 'Êtes-vous sûr de vouloir réinitialiser tout le stock ? Cette action est irréversible et mettra à zéro les quantités de tous les produits.';
            } else if (type === 'products') {
                message = 'Êtes-vous sûr de vouloir réinitialiser tout le catalogue ? Cette action est irréversible et supprimera tous les produits qui ne sont pas en stock.';
            } else {
                console.error('Type de réinitialisation non reconnu:', type);
                return;
            }
            
            // Créer un template temporaire pour la confirmation
            const tempId = 'tpl-temp-reset-confirm';
            
            // Vérifier si le template existe déjà
            let tempTemplate = document.getElementById(tempId);
            if (!tempTemplate) {
                // Créer le template s'il n'existe pas
                tempTemplate = document.createElement('template');
                tempTemplate.id = tempId;
                document.body.appendChild(tempTemplate);
            }
            
            // Définir le contenu du template
            tempTemplate.innerHTML = `
                <h3>Confirmation de réinitialisation</h3>
                <div class="confirm-message">
                    <p id="reset-confirmation-message">${message}</p>
                </div>
                <div class="form-actions">
                    <button id="confirm-reset-btn" type="button" class="btn danger">Confirmer la réinitialisation</button>
                    <button type="button" class="btn secondary close-modal">Annuler</button>
                </div>
            `;
            
            // Afficher la modale avec ce template
            LeDiplomate.modals.show(tempId);
            
            // Ajouter l'événement de confirmation
            setTimeout(() => {
                const confirmBtn = document.getElementById('confirm-reset-btn');
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        let success = false;
                        let successMessage = '';
                        
                        if (type === 'stock') {
                            // Réinitialiser le stock
                            success = LeDiplomate.dataManager.resetStock();
                            successMessage = 'Stock réinitialisé avec succès';
                        } else if (type === 'products') {
                            // Réinitialiser les produits
                            const result = LeDiplomate.dataManager.resetProducts();
                            success = result.success;
                            successMessage = result.message;
                        }
                        
                        // Fermer la modale
                        LeDiplomate.modals.hide();
                        
                        // Notification
                        if (success) {
                            LeDiplomate.notifications.show(successMessage, 'success');
                        } else {
                            LeDiplomate.notifications.show(successMessage || 'Erreur lors de la réinitialisation', 'error');
                        }
                        
                        // Recharger les données
                        this.loadProductsData();
                    });
                }
            }, 100);
        } catch (error) {
            console.error('Erreur lors de l\'affichage de la confirmation de réinitialisation:', error);
            LeDiplomate.notifications.show('Erreur lors de l\'affichage de la confirmation', 'error');
        }
    },

    /**
     * Importe des produits et stocks depuis un fichier Excel
     */
    importProductsExcel: function() {
        try {
            // Créer un input file temporaire
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx, .xls, .csv';
            
            // Gérer la sélection du fichier
            input.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Afficher le loader
                const loader = document.getElementById('loader');
                if (loader) loader.classList.remove('hidden');
                
                // Importer d'abord les produits
                LeDiplomate.dataManager.import.fromExcel(file, 'products', productResult => {
                    if (productResult.success) {
                        // Puis importer le stock
                        LeDiplomate.dataManager.import.fromExcel(file, 'stock', stockResult => {
                            // Masquer le loader
                            if (loader) loader.classList.add('hidden');
                            
                            // Afficher la notification de résultat
                            const productCount = productResult.count || 0;
                            const stockCount = stockResult.success ? (stockResult.count || 0) : 0;
                            
                            LeDiplomate.notifications.show(
                                `Importation réussie : ${productCount} produits et ${stockCount} articles en stock importés.`,
                                'success'
                            );
                            
                            // Recharger les données
                            this.loadProductsData();
                        });
                    } else {
                        // Masquer le loader en cas d'erreur
                        if (loader) loader.classList.add('hidden');
                        
                        // Notification d'erreur
                        LeDiplomate.notifications.show(
                            `Erreur lors de l'importation : ${productResult.message || 'Format de fichier incorrect'}`,
                            'error'
                        );
                    }
                });
            });
            
            // Déclencher la boîte de dialogue de sélection de fichier
            input.click();
        } catch (error) {
            console.error('Erreur lors de l\'importation Excel:', error);
            LeDiplomate.notifications.show('Erreur lors de l\'importation : ' + error.message, 'error');
            
            // Masquer le loader en cas d'erreur
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
        }
    },
    
    /**
     * Exporte les produits et stocks vers un fichier Excel
     */
    /**
 * Fonction améliorée pour l'export Excel
 * Remplace la fonction exportProductsExcel dans le module produits.js
 */
exportProductsExcel: function() {
    try {
        // Récupérer toutes les données nécessaires à l'export
        const products = this.currentItems;
        
        if (products.length === 0) {
            LeDiplomate.notifications.show('Aucun produit à exporter', 'warning');
            return;
        }
        
        // Préparer les données pour l'export avec toutes les caractéristiques
        const exportData = products.map(product => ({
            'Marque': product.brand || '',
            'Nom du cigare': product.name || '',
            'Pays d\'origine': product.country || '',
            'Vitole': product.vitole || '',
            'Cape': product.wrapper || '',
            'Sous-cape': product.binder || '',
            'Tripe': product.filler || '',
            'Force/Intensité': product.strength || '',
            'Quantité en stock': product.quantity || 0,
            'Prix': product.price ? product.price.toFixed(2) : '0.00',
            'Fournisseur': product.supplierName || ''
        }));
        
        // Créer le workbook Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Complet');
        
        // Déclencher le téléchargement
        const fileName = 'catalogue-cigares-complet.xlsx';
        XLSX.writeFile(wb, fileName);
        
        // Afficher une notification de succès
        LeDiplomate.notifications.show(
            `Export réussi : ${exportData.length} produits exportés vers ${fileName}`,
            'success'
        );
    } catch (error) {
        console.error('Erreur lors de l\'exportation Excel:', error);
        LeDiplomate.notifications.show('Erreur lors de l\'exportation : ' + error.message, 'error');
    }
},
    
    /**
     * Fonction utilitaire pour limiter le nombre d'appels à une fonction
     * @param {Function} func - Fonction à exécuter
     * @param {number} wait - Délai en millisecondes
     * @returns {Function} - Fonction limitée
     */
    debounce: function(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
};