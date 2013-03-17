/**
*
*/

var CJTBlocks;

/*
*
*
*/
(function($){

	/*
	*
	*
	*/
	CJTBlocks = function() {

		/**
		*
		*
		*
		*/
		this.hasBlocksElement = CJTBlocksPage.blocksForm.find('input:hidden#cjt-hasBlocks');
		
		/**
		* 
		*/
		this.signature = "cjtoolbox";
		
		/**
		*
		*
		*
		*
		*
		*/
		this.calculateChanges = function(changes, id, change) {
			var isChanged = false;
			// If field value changed add it to changes list.
			if (change) {
				changes[id] = true;
			}
			else {
				// Remove unchanged element.
				delete changes[id];
			}
			// Change is detected if there is at least one element found.
			$.each(changes,
				function() {
					if (this == true) {
						isChanged = true;
						return;
					}
				}
			);
			return isChanged;
		}
		
		/*
		*
		*
		*
		*/		
		this.getBlock = function(id) {
			var elementId = this.signature + '-' + id;
			var node = $('div#' + elementId);
			return node;
		}
		
		/**
		* 
		*
		* 
		*/		
		this.getBlocks = function() {
			return $('div[id^="' + this.signature + '"].postbox');
		}
		
		/*
		*
		*
		*
		*/		
		this.getExistsIds = function() {
			var idsElement = CJTBlocksPage.blocksForm.find('input:hidden[name="blocks[]"]');
			var ids = [];
			$(idsElement).each(
				function() {
					var id = parseInt($(this).val());
					ids.push(id);
				}
			)
			return ids;
		}
		
		/**
		* 
		*/
		this.getSortableName = function(id) {
			return 'cjtoolbox-' + id;
		}
		/*
		*
		*
		*
		*/
		this.hasBlocks = function(has) {
			var hasBlocks = this.hasBlocksElement.val();
			// Setter.
			if (has != undefined) {
				this.hasBlocksElement.val(has);
			}
			// Return old value.
			return ((hasBlocks == 'true') ? true : false);
		}
		
		/**
		* 
		*/
		this.toArray = function(prop, blocks) {
			// Initialize vars!
			var list = [];
			if (blocks == undefined) {
				blocks = this.getBlocks();
			}
			// Get property value for all blocks!
			$.each(blocks, function() {
					list.push(this.CJTBlock.block.get(prop));
				}
			);
			return list;
		}
		
	} // End class.
	
})(jQuery);