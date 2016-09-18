using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO.Ports;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace ProxyServer
{
    /// <summary>
    /// Model class used to store the application's data. This model is replicatd in the JS layer as well.
    /// </summary>
    class Model
    {

        private String target;

        /// <summary>
        /// The target onto which the HTTP requests will be dispatched.
        /// </summary>
        public String Target
        {
            get { return target; }
            set { target = value; }
        }

        private List<Request> incoming;

        /// <summary>
        /// The list of already processed incoming requests.
        /// </summary>
        internal List<Request> Incoming
        {
            get { return incoming; }
        }

        private List<Response> outgoing;

        /// <summary>
        /// The list of responses to issued outgoing requests.
        /// </summary>
        internal List<Response> Outgoing
        {
            get { return outgoing; }
        }

        private Dictionary<String, ComPort> ports;

        /// <summary>
        /// A mapping between available serial port names and instances representing each port.
        /// </summary>
        internal Dictionary<String, ComPort> Ports
        {
            get { return ports; }
        }

        public Model()
        {	
			//Change the URL to match the diploma package on the HANA MDC
            target = "https://databaseuser.hana.ondemand.com/spet/diploma";
            incoming = new List<Request>();
            outgoing = new List<Response>();
            ports = new Dictionary<String, ComPort>();
            string[] portNames = SerialPort.GetPortNames();
            foreach (string port in portNames) {
                ports.Add(port, new ComPort(port, false));
            }
        }

        /// <summary>
        /// Serializes the current model into a JSON object.
        /// </summary>
        /// <returns> A JSON representation of the model. </returns>
        public JObject ToJson()
        {
            JObject result = new JObject();
            result.Add("target", this.target);
            
            JArray jArray = new JArray();
            foreach (Request request in this.incoming) {
                jArray.Add(request.ToJson());
            }
            result.Add("incoming", jArray);

            jArray = new JArray();
            foreach (Response request in this.outgoing)
            {
                jArray.Add(request.ToJson());
            }
            result.Add("outgoing", jArray);

            JObject jObject = new JObject();
            foreach (var port in this.ports)
            {
                jObject.Add(port.Key, port.Value.ToJson());
            }
            result.Add("ports", jObject);

            return result;
        }

    }

    /// <summary>
    /// Represents a serial port.
    /// </summary>
    class ComPort
    {
        private String name;

        /// <summary>
        /// The name of the serial port (e.g. COM10).
        /// </summary>
        public String Name
        {
            get { return name; }
            set { name = value; }
        }

        private bool enabled;

        /// <summary>
        /// Flag indicating if the port is being listened to by this application.
        /// </summary>
        public bool Enabled
        {
            get { return enabled; }
            set { enabled = value; }
        }

        /// <summary>
        /// Constructs a serial port representation.
        /// </summary>
        /// <param name="name">The name of the port.</param>
        /// <param name="enabled">Whether or not the port is being listened to by the application.</param>
        public ComPort(String name, bool enabled)
        {
            this.name = name;
            this.enabled = enabled;
        }

        /// <summary>
        /// Serializes this object into a JSON object.
        /// </summary>
        /// <returns>A json representation of this object.</returns>
        public JObject ToJson()
        {
            JObject result = new JObject();
            result.Add("name", this.name);
            result.Add("enabled", this.enabled);
            return result;
        }

    }

    /// <summary>
    /// Represents a HTTP response to a previously sent request.
    /// </summary>
    class Response
    {
        private DateTime date;

        /// <summary>
        /// The date at which the response was received.
        /// </summary>
        public DateTime Date
        {
            get { return date; }
            set { date = value; }
        }

        private String method;

        /// <summary>
        /// The method of the request used to trigger the response.
        /// </summary>
        public String Method
        {
            get { return method; }
            set { method = value; }
        }

        private String path;

        /// <summary>
        /// The local path on which the request was made.
        /// </summary>
        public String Path
        {
            get { return path; }
            set { path = value; }
        }

        private int status;

        /// <summary>
        /// The HTTP status code of the reponse.
        /// </summary>
        public int Status
        {
            get { return status; }
            set { status = value; }
        }

        private String body;

        /// <summary>
        /// The body of the reponse.
        /// </summary>
        public String Body
        {
            get { return body; }
            set { body = value; }
        }

        public Response(Request request, int status, String body)
        {
            this.date = DateTime.Now;
            this.method = request.Method;
            this.path = request.Path;
            this.status = status;
            this.body = body;
        }

        /// <summary>
        /// Serializes this object into a JSON object.
        /// </summary>
        /// <returns>A json representation of this object.</returns>
        public JObject ToJson()
        {
            JObject result = new JObject();
            result.Add("date", this.date.ToString("yyyy-MM-dd'T'HH:mm:ss"));
            result.Add("method", this.method);
            result.Add("path", this.path);
            result.Add("status", this.status);
            result.Add("body", this.body);
            return result;
        }
    }

    /// <summary>
    /// Represents an incoming (HTTP) response.
    /// </summary>
    class Request
    {
        Dictionary<String, String> headers;

        /// <summary>
        /// Name - value mapping for the headers of the request.
        /// </summary>
        public Dictionary<String, String> Headers
        {
            get { return headers; }
        }

        private DateTime date;

        /// <summary>
        /// The date / time at which the request was received.
        /// </summary>
        public DateTime Date
        {
            get { return date; }
            set { date = value; }
        }

        private String method;

        /// <summary>
        /// The HTTP method used to make the request.
        /// </summary>
        public String Method
        {
            get { return method; }
            set { method = value; }
        }

        private String path;

        /// <summary>
        /// The local path on which the request was made.
        /// </summary>
        public String Path
        {
            get { return path; }
            set { path = value; }
        }

        private String body;

        /// <summary>
        /// The body of the request if applicable.
        /// </summary>
        public String Body
        {
            get { return body; }
            set { body = value; }
        }

        private String channel;

        /// <summary>
        /// The channel through which the request was received (e.g. the serial port name).
        /// </summary>
        public String Channel
        {
            get { return channel; }
            set { channel = value; }
        }

        public Request(String method, String path)
        {
            this.headers = new Dictionary<string, string>();
            this.date = DateTime.Now;
            this.method = method;
            this.path = path;
        }

        public Request(DateTime date, String method, String path, int status, String body, String channel)
        {
            this.headers = new Dictionary<string, string>();
            this.date = date;
            this.method = method;
            this.path = path;
            this.body = body;
            this.channel = channel;
        }

        /// <summary>
        /// Serializes this object into a JSON object.
        /// </summary>
        /// <returns>A json representation of this object.</returns>
        public JObject ToJson()
        {
            JObject result = new JObject();
            result.Add("date", this.date.ToString("yyyy-MM-dd'T'HH:mm:ss"));
            result.Add("method", this.method);
            result.Add("path", this.path);
            result.Add("body", this.body);
            result.Add("channel", this.channel);
            return result;
        }
    }
}
