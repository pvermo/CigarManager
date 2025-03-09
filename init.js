/**
 * Script d'initialisation pour le nouveau modèle unifié de produits - Le Diplomate
 * Ce script s'exécute au chargement de la page et adapte l'interface pour la nouvelle structure
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du nouveau modèle unifié de produits');
    
    // 1. Mise à jour du menu de navigation : suppression de l'onglet Stock
    const navigation = document.querySelector('nav ul');
    if (navigation) {
        // Chercher l'élément du menu Stock
        const stockNavItem = Array.from(navigation.querySelectorAll('li')).find(li => {
            const link = li.querySelector('a');
            return link && link.getAttribute('data-module') === 'stock';
        });
        
        // Supprimer l'élément du menu Stock s'il existe
        if (stockNavItem) {
            navigation.removeChild(stockNavItem);
            console.log('Onglet Stock supprimé du menu de navigation');
        }
        
        // Mettre à jour le texte de l'onglet Produits
        const produitsNavItem = Array.from(navigation.querySelectorAll('li')).find(li => {
            const link = li.querySelector('a');
            return link && link.getAttribute('data-module') === 'produits';
        });
        
        if (produitsNavItem) {
            const link = produitsNavItem.querySelector('a');
            if (link) {
                link.textContent = 'Produits & Stock';
                console.log('Texte de l\'onglet Produits mis à jour');
            }
        }
    }
    
    // 2. Remplacer le template des produits par la nouvelle version
    const originalTemplate = document.getElementById('tpl-produits');
    if (originalTemplate && window.unifiedProductsTemplate) {
        // Remplacer le contenu du template
        originalTemplate.innerHTML = window.unifiedProductsTemplate;
        console.log('Template des produits mis à jour');
    }
    
    // 3. S'assurer que le module de données est correctement initialisé
    if (LeDiplomate.dataManager) {
        // Ajouter une méthode pour convertir les données au nouveau format si nécessaire
        LeDiplomate.dataManager.migrateToUnifiedModel = function() {
            // Vérifier si la migration est nécessaire
            console.log('Vérification de la nécessité de migrer les données...');
            
            // Pour l'instant, nous continuons à utiliser le même format de données
            // car notre implémentation préserve la rétrocompatibilité
            
            console.log('Système de données compatible avec le nouveau modèle unifié');
            return true;
        };
        
        // Exécuter la migration si nécessaire
        LeDiplomate.dataManager.migrateToUnifiedModel();
    }
    
    // 4. Modifier le comportement de chargement des modules
    if (LeDiplomate.loadModule) {
        const originalLoadModule = LeDiplomate.loadModule;
        
        LeDiplomate.loadModule = function(moduleName) {
            // Rediriger les demandes de chargement du module stock vers le module produits
            if (moduleName === 'stock') {
                console.log('Redirection de la demande de chargement du module Stock vers le module Produits');
                moduleName = 'produits';
            }
            
            // Appeler la fonction originale avec le nom de module approprié
            originalLoadModule.call(LeDiplomate, moduleName);
        };
        
        console.log('Comportement de chargement des modules mis à jour');
    }
    
    console.log('Initialisation du nouveau modèle unifié de produits terminée');
});

// Stocker le contenu du template unifié pour l'injecter plus tard
window.unifiedProductsTemplate = `
    <div class="module-container">
        <h2>Gestion des Produits</h2>
        
        <div class="actions-bar">
            <div class="search-bar">
                <input type="text" id="product-catalog-search" placeholder="Rechercher un produit...">
                <button id="product-search-btn" class="btn primary">Rechercher</button>
            </div>
            <div class="action-buttons">
                <button id="add-product-item" class="btn secondary">Ajouter Produit</button>
                <button id="import-products" class="btn secondary">Importer Excel</button>
                <button id="export-products" class="btn secondary">Exporter Excel</button>
                <button id="reset-products" class="btn danger">Réinitialiser le catalogue</button>
            </div>
        </div>
        
        <div class="products-table-container">
            <table id="products-table" class="data-table">
                <thead>
                    <tr>
                        <th>Marque</th>
                        <th>Nom</th>
                        <th>Origine</th>
                        <th>Vitole</th>
                        <th>Cape</th>
                        <th>Sous-cape</th>
                        <th>Tripe</th>
                        <th>Force</th>
                        <th>Quantité</th>
                        <th>Prix</th>
                        <th>Fournisseur</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="product-items">
                    <!-- Les produits seront ajoutés ici dynamiquement -->
                </tbody>
            </table>
        </div>
        
        <div class="pagination" id="products-pagination"></div>
    </div>
`;

// Ajouter des styles supplémentaires pour le modèle unifié
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .stock-adjustment-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stock-adjustment-controls input {
            width: 80px;
            text-align: center;
        }
        
        .stock-adjustment-controls button {
            width: 30px;
            height: 30px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .text-danger {
            color: var(--error-color);
        }
        
        .fw-bold {
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(style);
});