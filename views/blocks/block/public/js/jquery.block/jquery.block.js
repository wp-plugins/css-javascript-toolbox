/**
* @version $ Id; block.jquery.js 21-03-2012 03:22:10 Ahmed Said $
* 
* CJT Block jQuery Plugin
*/

/**
* JQuery wrapper for the CJTBlockPlugin object. 
*/
(function($) {

	/**
	* Default block features and options.
	*
	* @var object
	*/
	var defaultOptions = {
		showObjectsPanel : true,
		calculatePinPoint : 1,
		copy : {fields : ['code', 'links', 'expressions', 'pages', 'posts', 'categories', 'pinPoint']}
	};

	/**
	* Element to loads for each block.
	*
	* This element is commonly used in various places inside the Plugin.
	* there is no need to find them everytime we need it. Load it only one time.
	* 
	* @var object
	*/	
	var autoLoadElements = {
		codeEditor : 'textarea.code-editor',
		editBlockName : 'div.edit-block-name',
		blockName : 'span.block-name',
		insideMetabox : 'div.inside'
	};

	/**
	* Block jQuery Plugin.
	*
	* The purpose is to handle all block functionality and UI.
	*
	* @version 6
	* @Author Ahmed Said
	*/
	CJTBlockPluginBase = function() {
		
		/**
		* Block model for accessing block properties.
		*
		* @var CJTBlock
		*/
		this.block;
		
		/**
		*
		*
		*/
		this.changes;

		/**
		* Commonly accessed elements stored here.
		*
		* @var object
		*/
		this.elements;
		
		/**
		* Block features and options.
		*
		* @var object
		*/			
		this.features;
		
		/**
		* 
		*
		* 
		*/	
		this.toolbox = null;
		
		/**
		* Event handler for cancel edit block name.
		*
		* Cancel edit name can be done throught two ways.
		*		- Press Escape inside edit block name input.
		*		- Click cancel edit name icon.
		*/
		this._oncanceleditname = function() {
			var editName = this.elements.editBlockName;
			// Hide edit block area.
			editName.css('display', 'none')
			// Unbind events that binded when the edit block name form is displayed.
			.find('input.block-name').unbind('keydown.editName');
		}
		
		/**
		*
		*
		*/
		this._oncontentchanged = function(event) {
			var element;
			var id; // Give every field an id for tracing change.
			var newValue; // Field new value.
			var enable; // Used to enable/disable save button
									// based on detected changes.
			var isFieldChanged;
			var isChanged;
			var syncValue; // This is the value stored in server.
			// Get value, id and sync value based on the input field type.
			if (event.target == undefined) { // Ace editor event system don't
				element = this.block.aceEditor;
				// pass aceEditor object as context!
				newValue = hex_md5(element.getSession().getValue());
			}
			else { // All HTML native types.
				element = event.target;
				// Use field "value" property for getting new 
				// context except checkboxes uses checked property.
				newValue = (element.type == 'checkbox') ? newValue = $(element).prop('checked') : element.value;
			}
			id = element.cjtBlockFieldId;
			syncValue = element.cjtBlockSyncValue;
			// Detect if value is changes.
			isFieldChanged = (newValue != syncValue);
			isChanged = CJTBlocksPage.blocks.calculateChanges(this.changes, id, isFieldChanged);
			// Enable button is there is a change not saved yet, disable it if not.
			this.toolbox.buttons.save.enable(isChanged);
			// Notify blocks page.
			CJTBlocksPage.blockContentChanged(this.block.id, isChanged);
		}
		
		/**
		* Event handler for delete the block.
		*
		* The method delete the block from the UI but not permenant from the server.
		* Save all Changes should be called in order to save deleted blocks.
		*/
		this._ondelete = function() {
			// Conformation message.
			var confirmMessage = CJTJqueryBlockI18N.confirmDelete;
			// Show Block name!
			confirmMessage = confirmMessage.replace('%s', this.block.get('name'));
			// Confirm deletion!
			if (confirm(confirmMessage)) {
				// Delete block.
			  CJTBlocksPage.deleteBlocks(this.block.box);
			}
		}
		
		/**
		*
		*
		*
		*
		*/
		this._ondisplayrevisions = function() {
			var revisionsFormParams = {
				id : this.block.get('id'),
				width : 300,
				height : 250,
				TB_iframe : true
			};
			var url = CJTBlocksPage.server.getRequestURL('block', 'get_revisions', revisionsFormParams);
			tb_show(CJTJqueryBlockI18N.blockRevisionsDialogTitle, url);
		}
		
		/**
		* Event handler for start editing block name.
		*
		* The method display edit block name box and and associate all
		* the required event for save or cancel editing.
		*
		*/
		this._oneditname = function(event) {
			var editName = this.elements.editBlockName;
			var inputText = editName.find('input.block-name');
			// When block name clicked don't toggle postbox.
			event.stopPropagation();
			// Check if already in edit mode.
			if (editName.css('display') == 'none') {
				// Cancel or Save editing when ESCAPE or Enter button is pressed.
				inputText.bind('keydown.editName', $.proxy(
					function(event) {
						if (event.keyCode == 27) {
							// Cancel
							this._oncanceleditname();
						}
						else if (event.keyCode == 13) {
							// Save
							this._onsavename();
							event.preventDefault();
						}
					}, this)
				);
				// Put it exactly above the block name - padding.
				editName.css('left', ((this.elements.blockName.position().left - 2) + 'px')) ;
				// Set input styles
				var styles = {
					'background-color' : this.block.box.find('.hndle').css('background-color'),
					'font-size' : this.elements.blockName.css('font-size'),
					'font-family' : this.elements.blockName.css('font-family')
				};
				inputText.css(styles);
				// Display.
				editName.css('display', 'block');
				// When the input lost the focus cancel edit.
				// Get name.
				inputText.val(this.block.get('name'));
				// Set focus.
				inputText.focus();
			}
		}
		
		/**
		*
		*
		*
		*
		*/
		this._ongetinfo = function() {
			// Server request.
			var requestData = {
				// Server paramerers.
				id : this.block.get('id'),
				// Thick box parameters.
				width : 300,
				height: 190
			};
			var url = CJTBlocksPage.server.getRequestURL('block', 'get_info_view', requestData);
			tb_show(CJTJqueryBlockI18N.blockInfoTitle, url);
		}
		
		/**
		* Don't show popup menus if Block is minimized!
		*/
		this._onpopupmenu = function(targetElement, button) {
			var show = true;
			if (this.block.box.hasClass('closed')) {
				show = false;
			}
			return show;
		}
		
		/**
		* 
		*/
		this._onpostboxopened = function() {
			this.block.aceEditor.resize();
		}
		
		/**
		* Event handler for saving block data.
		*
		* The method send the block data to the server.
		* @see CJTBlock.saveDIFields method for more details about fields.
		*
		*/
		this._onsavechanges = function() {
			var saveButton = this.toolbox.buttons['save'];
			// Dont save unless there is a change!
			if (saveButton.jButton.hasClass('cjttbs-disabled')) {
				// Return REsolved Dummy Object for standarizing sake!
				return CJTBlocksPage.server.getDeferredObject().resolve().promise();
			}
			// Queue User Direct Interact fields (code, posts, categories, links, expressions etc...).
			var data = {calculatePinPoint : this.features.calculatePinPoint, createRevision : 1};
			// Push DiFields inside Ajax queue.
			this.block.queueDIFields();
			// But save button into load state (Inactive and Showing loading icon).
			saveButton.loading(true);
			this.enable(false);
			// Send request to server.
			return this.block.sync('saveDIFields', data)
			.success($.proxy(
				function() {
					// Stop loading effect and disable the button.
					saveButton.loading(false, false);
					// Sync fields with server value.
					// This refrssh required for notifying saving
					// change to detect changes.
					var diFields = this.block.getDIFields();
					// Push aceEditor into diFields list.
					diFields[diFields.length++] = this.block.aceEditor;
					diFields.each(
						function() {
							this.cjtSyncInputField();
						}
					);
					// Tell blocks page that block is saved and has not changed yet.
					CJTBlocksPage.blockContentChanged(this.block.id, false);
				}, this)
			)
			.error($.proxy(
				function() {
					saveButton.loading(false);
				}, this)
			).complete($.proxy(
				function() {
					this.enable(true);
				}, this)
			);
		}
		
		/**
		* Event handler for saveing block name.
		*
		* This method validate block name and send new block name to the server.
		*/
		this._onsavename = function () {
			// Save only if new and old name are not same.
			var blockName = this.elements.editBlockName.find('input.block-name').val();
			// Name cannot be empty!
			if (!blockName) {
				// Reset the name back!
				// fill name so the below code will be compatible to handle both cases.
				blockName = this.block.get('name');
				// Show message!
				alert(CJTJqueryBlockI18N.nameCantBeEmpty);
			}
			// Change block name.
			this.block.set('name', blockName)
			.success($.proxy(
				function(rName) {
				// Update metabox title when sucess.
				this.elements.blockName.text(rName.value);
				}, this)
			);
			// Update on server.
			this.block.sync('name');
			// Hide edit name input field and tasks buttons.
			this._oncanceleditname();
		}
		
		/**
		*
		*
		*
		*
		*/
		this._onswitcheditorlang = function(event, params) {
			var cssMap = {
				css : 'cjttbl-editor-language-css',
				html : 'cjttbl-editor-language-html',
				javascript : 'cjttbl-editor-language-javascript',
				php : 'cjttbl-editor-language-php'
			};
			var jLanguageSwitcher = this.block.box.find('.cjttbl-switch-editor-language');
			var languageSwitcher = jLanguageSwitcher.get(0);
			// Note: Event and params parameter is passed but unused,
			// we need only selectedValue.
			// Set editor mode.
			var editorMode = 'ace/mode/' + params.lang;
			this.block.aceEditor.getSession().setMode(editorMode);
			// Save editor language for block.
			this.block.set('editorLang', params.lang);
			/// Change switcher icon to the selected language ///
			// If there is previously selected language remove its css class.
			if (languageSwitcher.cjtbCurrentLangClass != undefined) {
				jLanguageSwitcher.removeClass(languageSwitcher.cjtbCurrentLangClass);
			}
			// Add new class.
			jLanguageSwitcher.addClass(cssMap[params.lang]);
			// Store current selected language for later use.
			languageSwitcher.cjtbCurrentLangClass = cssMap[params.lang];
		}
		
		/**
		* Event handler for switch block flag.
		*
		* @param event Javascript event object.
		* @param object Toolbox evenr parameters.
		*/
		this._onswitchflag = function(event, params) {
			var target = $(event.target);
			var oldValue = this.block.get(params.flag);
			var flagButton = this.toolbox.buttons[params.flag + '-switch'];
			// Put the Flag button into load state (Inactive + loading icon).
			flagButton.loading(true);
			// Switch flag state.
			this.block.switchFlag(params.flag, params.newValue).success($.proxy(
				function(rState) {
					var oldCSSClass = params.flag + '-' + oldValue;
					var newCSSClass = params.flag + '-' + rState.value;
					target.removeClass(oldCSSClass).addClass(newCSSClass)
					// Switch title based on current FLAG and the new VALUE.
					.attr('title', CJTJqueryBlockI18N[params.flag + '_' + rState.value + 'Title']);
				}, this)
			);
			// Update on server.
			this.block.sync(params.flag)
			.complete($.proxy(
				function() {
					flagButton.loading(false);
				}, this)
			);
		}
		
		/**
		*
		*
		*
		*
		*/		
		this.copy = function(data) {
			var properties = this.features.copy.fields;
			$.each(properties, $.proxy(
				function(index, name) {
					var property = this.block.property(name);
					// Use setValue Fields Common Setter Interface (FCSI) impleneted by CJTBlock.
					property.setValue(data[name]);
				}, this)
			);			
		}
		
		/**
		*
		*
		*
		*
		*/
		this.enable = function(state) {
			var elements = this.block.box.find('input:checkbox, textarea, select');
			switch (state) {
				case true: // Enable block.
					elements.removeAttr('disabled');
				break;
				case false: // Disable block.
					elements.attr('disabled', 'disabled');
				break;
			}
			// Enable or Disable ACEEditor.
			// Enable = true then setReadnly = false and vise versa.
			this.block.aceEditor.setReadOnly(!state);
		}
		
		/**
		* Make block code is the active element.
		*
		* @return false.
		*/		
		this.focus = function() {
			this.block.aceEditor.focus();
		}
		
		/**
		* Initialize Block Plugin object.
		*
		*
		*/
		this.initCJTPluginBase = function(node, args) {
			// Initialize object properties!
			this.block = new CJTBlock(node)
			this.features = $.extend(defaultOptions, args);
			// Load commonly used elements.
			this.elements = {};
			$.each(autoLoadElements, $.proxy(
				function(name, selector) {
					this.elements[name] = this.block.box.find(selector);
				}, this)
			);
			// Initialize User Interface.
			this.initUI();
			// Prepare input elements for notifying user changes.
			this.notifySavingChangesInit();
			// Set Plugin options.
			this.setOptions();
		}
		
		/**
		* @internal 
		*
		* Initialize User Interface for block.
		*
		* @return void
		*/
		this.initUI = function() {
			var model = this.block;
			// Move edit-block-name edit area and tasks-bar outside Wordpress metabox "inside div".
			this.elements.insideMetabox.before(model.box.find('.edit-block-name, .block-toolbox'));
			var events = { // In-Place edit block name events.
				'span.block-name' : $.proxy(this._oneditname, this),
				'.edit-block-name a.save' : $.proxy(this._onsavename, this),
				'.edit-block-name a.cancel' : $.proxy(this._oncanceleditname, this)
			};
			$.each(events, $.proxy(
				function(selector, handler) {
					model.box.find(selector).click(handler);
				}, this)
			);
			// remove code textarea and replace it with ace editor.
			var initCode = model.box.find('textarea.initCode');
			model.aceEditor.setTheme('ace/theme/chrome');
			model.aceEditor.getSession().setValue(initCode.val());
			model.aceEditor.setShowPrintMargin(false);
			// Remove textarea with code transfered from server.
			initCode.remove();
			// Activate toolbox.
			this.toolbox = model.box.find('.block-toolbox').CJTToolBox({
				context : this,
				handlers : {
					'templates-lookup' : {
						type : 'Popup',
						callback : this._onlookuptemplates,
						params : {
								fitToScreen : true, /* Custom to be used inside this._onpopupmenu() method */
							_type : {
								onPopup : this._onpopupmenu,
								targetElement : '.templates-lookup',
								setTargetPosition : false
							}
						}
					},
					'switch-editor-language' : {
						type : 'Popup',
						params : {
							// Parameters for PopupList type button.
							_type : {
								onPopup : this._onpopupmenu,
								targetElement : '.editor-langs',
								setTargetPosition : false
							}
						}
					},
					'editor-language-css' : {callback : this._onswitcheditorlang, params : {lang : 'css'}},
					'editor-language-html' : {callback : this._onswitcheditorlang, params : {lang : 'html'}},
					'editor-language-javascript' : {callback : this._onswitcheditorlang, params : {lang : 'javascript'}},
					'editor-language-php' : {callback : this._onswitcheditorlang, params : {lang : 'php'}},
					'state-switch' : {callback : this._onswitchflag, params : {flag : 'state'}},
					'save' : {callback : this._onsavechanges, params : {enable : false}},
					'revisions' : {callback : this._ondisplayrevisions},
					'delete' : {callback : this._ondelete},
					'location-switch' : {callback : this._onswitchflag, params : {flag : 'location'}},
					'get-shortcode' : {callback : this._ongetshortcode},
					'edit-name' : {callback : this._oneditname},
					'info' : {callback : this._ongetinfo},
				}
			}).get(0).CJTToolBox;
			// Select previously choosed editor language.
			this._onswitcheditorlang(undefined, {lang : model.get('editorLang', 'css')});
			// Register COMMAND-KEYS.
			this.registerCommands();
			// Switch Block state if required, if state is empty nothing will happen.
			// Until now only 'restore' state is supported to prevent saving restored block.
			this.switchState(this.features.state);
			// Display block. 
			// !important: Blocks come from server response doesn't need this but the newly added blocks does.
			// need sometime to be ready for display.
			model.box.css({display : 'block'}).addClass('cjt-block');
		}
		
		/**
		*
		* For now it initialize fields for notifying user changes.
		*
		*
		*
		*/
		this.notifySavingChangesInit = function() {
			var model = this.block;
			var aceEditor = model.aceEditor;
			var fields = model.getDIFields();
			// Initialize vars.
			this.changes = [];
			// Create common interface for ace editor to
			// be accessed like other HTML elements.
			aceEditor.type = 'aceEditor'; // Required for _oncontentchanged to behave correctly.
			/**
			* Bind method for bind events like HTML Elements.
			*/
			aceEditor.bind = function(e, h) {
				this.getSession().doc.on(e, h);
			}
			/**
			* Method to get hash copy from stored content.
			*/
			aceEditor.cjtSyncInputField = function() {
				this.cjtBlockSyncValue = hex_md5(this.getSession().getValue());	
			}
			// Hack jQuery Object by pushing
			// ace Editor into fields list, increase length by 1.
			fields[fields.length++] = aceEditor;
			// For all fields call cjtSyncInputField and give a unique id.
			$.each(fields, $.proxy(
				function(fieldId, field) {
					// Assign weight number used to identify the field.
				  field.cjtBlockFieldId = fieldId;
				  // Create default cjtSyncInputField method if not exists.
				  if (field.cjtSyncInputField == undefined) {
			  		if (field.type == 'checkbox') {
			  			field.cjtSyncInputField = function() {
			  				this.cjtBlockSyncValue = $(this).prop('checked');
			  			}
			  		}
			  		else {
			  			field.cjtSyncInputField = function() {
			  				this.cjtBlockSyncValue = this.value;
			  			}			  	
			  		}
			  		// Create interface to "bind" too.
			  		field.bind = function(e, h) {
			  			$(this).bind(e, h);
			  		}
				  }
					// Sync field.
					field.cjtSyncInputField();
					// Bind to change event.
					field.bind('change', $.proxy(this._oncontentchanged, this));
				}, this)
			);
		}

		/**
		* 
		*/
		this.registerCommands = function() {
			var editorCommands = this.block.aceEditor.commands;
			var commands = [
				{
					name: 'Save-Changes',
					bindKey: {
						win : 'Ctrl-S',
						mac : 'Command-J'
					},
					exec: $.proxy(this._onsavechanges, this)
				}
			];
			/** Add Our Ace Save, Full screen and Code-Auto-Completion commands */
			editorCommands.addCommands(commands);
		}
		
		/**
		* Change Block options.
		*
		* NOT IMPLEMENTED YET.
		*
		*/
		this.setOptions = function() {
		
		}
		
		/*
		*
		*
		*
		*/
		this.switchState = function(state) {
			switch (state) {
				case 'restore':
					// Hide block toolbox.
					this.toolbox.jToolbox.hide();
					// Disable all fields.
					this.enable(false);
				break;
				default:
					 // Nothing for now
				break;
			}
		}
		
	} // End class.
	
	/**
	*	jQuery Plugin interface.
	*/
	$.fn.CJTBlock = function(args) {
		/**
		* Process every block object.
		*/		
		return this.each(function() {
			
			// If this is the first time to be called for this element
			// create new CJTBlockPlugin object for the this element.
			if (this.CJTBlock == undefined) {
				this.CJTBlock = new CJTBlockPlugin(this, args);
			}
			else {
				// Otherwise change options
				this.CJTBlock.setOptions(args);
			}
			return this;
		});
		
	} // End Plugin class.

})(jQuery);