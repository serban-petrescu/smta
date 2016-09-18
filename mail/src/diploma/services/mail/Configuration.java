package diploma.services.mail;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Loads and provides email account configurations.
 * 
 * @author Serban Petrescu
 */
enum Configuration {
	/**
	 * Singleton instance.
	 */
	INSTANCE;

	/**
	 * A map between email accounts and their respective cockpit destinations.
	 */
	private Map<String, String> accountDestinations;

	/**
	 * A map between email providers and available accounts.
	 */
	private Map<String, List<String>> providerAccounts;

	/**
	 * Private constructor which loads the Configuration.json file to fill in
	 * the necessary information.
	 */
	private Configuration() {
		accountDestinations = new HashMap<String, String>();
		providerAccounts = new HashMap<String, List<String>>();

		ObjectMapper mapper = new ObjectMapper();
		try {
			Service[] services = mapper.readValue(this.getClass().getResourceAsStream("Configuration.json"),
					Service[].class);
			for (Service s : services) {
				List<String> accounts = new ArrayList<String>();
				for (Account a : s.accounts) {
					accounts.add(a.address);
					accountDestinations.put(a.address, a.destination);
				}
				providerAccounts.put(String.format("%s (%s)", s.name, s.provider), accounts);
			}
		} catch (IOException e) {
			// if there is an error when loading the config, just report that no
			// accounts were found
			accountDestinations.clear();
			providerAccounts.clear();
		}

		accountDestinations = Collections.unmodifiableMap(accountDestinations);
		providerAccounts = Collections.unmodifiableMap(providerAccounts);
	}

	/**
	 * Gets the accounts for all providers.
	 * @return An unmodifiable map between providers and account lists.
	 */
	public Map<String, List<String>> getProviderAccounts() {
		return providerAccounts;
	}

	/**
	 * Retrieves the destination name for a given email account.
	 * @param address The email address.
	 * @return The name of the cockpit destination.
	 */
	public String getDestinationForAddress(String address) {
		return accountDestinations.get(address);
	}

	/**
	 * Helper POJO for storing service information.
	 * @author Serban Petrescu
	 */
	private static class Service {
		public String name;
		public String provider;
		public Account[] accounts;
	}

	/**
	 * Helper POJO for storing account information.
	 * @author Serban Petrescu
	 */
	private static class Account {
		public String address;
		public String destination;
	}
}
