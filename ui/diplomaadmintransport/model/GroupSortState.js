sap.ui.define([
		"sap/ui/base/Object",
		"sap/ui/model/Sorter"
	], function (BaseObject, Sorter) {
	"use strict";

	return BaseObject.extend("diploma.admin.transport.model.GroupSortState", {

		/**
		 * Creates sorters and groupers for the master list.
		 * Since grouping also means sorting, this class modifies the viewmodel.
		 * If a user groups by a field, and there is a corresponding sort option, the option will be chosen.
		 * If a user ungroups, the sorting will be reset to the default sorting.
		 * @class
		 * @public
		 * @alias diploma.admin.transport.model.GroupSortState
		 */
		constructor: function (oViewModel, fnGroupFunction) {
			this._oViewModel = oViewModel;
			this._fnGroupFunction = fnGroupFunction;
		},

		/**
		 * Sorts by description, or by 
		 *
		 * @param sKey - the key of the field used for grouping
		 * @returns {sap.ui.model.Sorter[]} an array of sorters
		 */
		sort: function (sKey) {
			var sGroupedBy = this._oViewModel.getProperty("/groupBy");

			if (sGroupedBy !== "None") {
				// If the list is grouped, remove the grouping since the user wants to sort by something different
				// Grouping only works if the list is primary sorted by the grouping - the first sorten contains a grouper function
				this._oViewModel.setProperty("/groupBy", "None");
			}

			return [new Sorter(sKey, false)];
		},

		/**
		 * Groups by , or resets the grouping for the key "None"
		 *
		 * @param sKey - the key of the field used for grouping
		 * @returns {sap.ui.model.Sorter[]} an array of sorters
		 */
		group: function (sKey) {
			var aSorters = [];

			if (sKey === "") {
				// Grouping means sorting so we set the select to the same Entity used for grouping
				this._oViewModel.setProperty("/sortBy", "");

				aSorters.push(
					new Sorter("", false,
						this._fnGroupFunction.bind(this))
				);
			} else if (sKey === "None") {
				// select the default sorting again
				this._oViewModel.setProperty("/sortBy", "description");
			}

			return aSorters;
		}

	});
});
