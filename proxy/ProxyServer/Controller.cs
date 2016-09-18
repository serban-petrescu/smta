using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.IO;
using System.IO.Ports;
using System.Threading;
using System.Net;

namespace ProxyServer
{
    /// <summary>
    /// Controller class for the application.
    /// </summary>
    class Controller
    {
        /// <summary>
        /// The JS injector helper object.
        /// </summary>
        private ScriptInjector injector;

        /// <summary>
        /// A mapping between port names and active listeners.
        /// </summary>
        private Dictionary<String, SerialListener> ports;

        /// <summary>
        /// The model of the application.
        /// </summary>
        private Model model;

        /// <summary>
        /// The HTTP client used to make requests to the remote server.
        /// </summary>
        private HttpClient client;

        public Controller(WebBrowser browser)
        {
            injector = new ScriptInjector(browser);
            browser.ObjectForScripting = injector;
            model = new Model();
            client = new HttpClient(model.Target);
            ports = new Dictionary<string, SerialListener>();

            injector.Register("getModel", (a) => {
                return new String[] { "getModel", model.ToJson().ToString(Formatting.None) };
            });

            injector.Register("openPort", (name) =>
            {
                createListener(name);
                return new String[] { "openPort", name };
            });

            injector.Register("closePort", (name) =>
            {
                if (ports.ContainsKey(name))
                {
                    ports[name].Close();
                    ports.Remove(name);
                }
                return new String[] { "onPortClosed", name, "false" };
            });

            injector.Register("changeTarget", (target) =>
            {
                model.Target = target;
                client.BaseUrl = target;
                return new String[] { "changeTarget" };
            });

            Task.Factory.StartNew(() =>
            {
                client.Run((error) =>
                {
                    injector.Send("onResult", new string[] { "onOutgoingError", error });
                }, (response) =>
                {
                    model.Outgoing.Add(response);
                    injector.Send("onResult", new string[] { "onOutgoing", response.ToJson().ToString(Formatting.None) });
                });
            });
        }

        /// <summary>
        /// Helper method for adding a new listener to a port.
        /// </summary>
        /// <param name="port">The name of the port which will be listened.</param>
        private void createListener(String port)
        {
            if (model.Ports.ContainsKey(port) && !ports.ContainsKey(port))
            {
                SerialListener listener = new SerialListener(port);
                listener.OnPortClosed = (name, err) =>
                {
                    ports.Remove(name);
                    injector.Send("onResult", new string[] { "onPortClosed", name, err ? "true" : "false" });
                };
                listener.OnRequestReceived = (req) =>
                {
                    lock (model.Incoming)
                    {
                        model.Incoming.Add(req);
                    }
                    client.Add(req);
                    injector.Send("onResult", new string[] { "onIncoming", req.ToJson().ToString(Formatting.None) });
                };
                ports[port] = listener;
                Task.Factory.StartNew(() =>
                {
                    listener.Run();
                });
            }
        }
    }

    /// <summary>
    /// A simple HTTP client which manages a queue of requests that have to be executed.
    /// </summary>
    class HttpClient
    {
        /// <summary>
        /// The queue of requests which need to be executed.
        /// </summary>
        private Queue<Request> queue;

        /// <summary>
        /// A lock which is used to prevent simultaneous access to the queue from concurrent threads.
        /// </summary>
        private object queueLock;

        /// <summary>
        /// Flag indicating if the HTTP client has started working.
        /// </summary>
        private bool started;

        private String baseUrl;

        /// <summary>
        /// The base URL used for executing the requests.
        /// </summary>
        public String BaseUrl
        {
            get { return baseUrl; }
            set { baseUrl = value; }
        }

        public HttpClient(String baseUrl)
        {
            queue = new Queue<Request>();
            queueLock = new object();
            started = false;
            this.baseUrl = baseUrl;
        }

        /// <summary>
        /// A delegate which can be used to "listen" for errors in the execution of web requests.
        /// </summary>
        /// <param name="message"></param>
        public delegate void OnSendError(String message);

        /// <summary>
        /// A delegate which can be used to "listen" for results of executed web request.
        /// </summary>
        /// <param name="response"></param>
        public delegate void OnResponse(Response response);

        /// <summary>
        /// Starts the HTTP client.
        /// </summary>
        /// <param name="onError"><see cref="HttpClient.OnSendError"/></param>
        /// <param name="onResponse"><see cref="HttpClient.OnResponse"/></param>
        public void Run(OnSendError onError, OnResponse onResponse)
        {
            started = true;
            while (started)
            {
                try
                {
                    onResponse(Send(Get()));
                }
                catch (Exception ex)
                {
                    onError(ex.Message);
                }
            }
        }

        /// <summary>
        /// Stops the HTTP client.
        /// </summary>
        public void Stop()
        {
            started = false;
        }

        /// <summary>
        /// Helper method for sending a HTTP request.
        /// </summary>
        /// <param name="request">The model request object containing the HTTP request's attributes.</param>
        /// <returns>A model response object containing the attributes of the HTTP response.</returns>
        private Response Send(Request request)
        {
            WebRequest httpRequest = WebRequest.Create(baseUrl + request.Path);
            httpRequest.Method = request.Method;
            if (request.Method != "GET" && request.Method != "DELETE")
            {
                byte[] byteArray = Encoding.UTF8.GetBytes(request.Body);
                httpRequest.ContentLength = byteArray.Length;
                Stream dataStream = httpRequest.GetRequestStream();
                dataStream.Write(byteArray, 0, byteArray.Length);
                dataStream.Close();
            }
            WebResponse httpResponse;
            try
            {
                httpResponse = httpRequest.GetResponse();
            }
            catch (WebException ex)
            {
                httpResponse = ex.Response;
            }
            String body;
            try
            {
                Stream dataStream = httpResponse.GetResponseStream();
                StreamReader reader = new StreamReader(dataStream);
                body = reader.ReadToEnd();
            }
            catch (Exception)
            {
                body = "";
            }
            return new Response(request, (int)((HttpWebResponse)httpResponse).StatusCode, body);
        }

        /// <summary>
        /// Adds a request to the queue.
        /// </summary>
        /// <param name="request">The model representation of the request.</param>
        public void Add(Request request)
        {
            lock(queueLock) {
                queue.Enqueue(request);
                Monitor.PulseAll(queueLock);
            }
        }

        /// <summary>
        /// Gets and removes a request from the queue. This call may block execution until a request is available.
        /// </summary>
        /// <returns>The oldest request in the queue.</returns>
        private Request Get()
        {
            lock (queueLock)
            {
                while (queue.Count == 0)
                {
                    Monitor.Wait(queueLock);
                }
                return queue.Dequeue();
            }
        }

    }

    /// <summary>
    /// Listens for HTTP request over a serial port.
    /// </summary>
    class SerialListener
    {
        /// <summary>
        /// Represents a method which should be called when a port close occurs.
        /// </summary>
        /// <param name="portName">The name of the port which has closed.</param>
        /// <param name="error">Flag indicating if an error caused the closing of the port.</param>
        public delegate void PortClosedHandler(String portName, bool error);
        
        /// <summary>
        /// Represents a method which should be called when a request was received and parsed.
        /// </summary>
        /// <param name="request">The received request.</param>
        public delegate void RequestReceivedHandler(Request request);

        /// <summary>
        /// The state which which the listener is located in the parsing FSM.
        /// </summary>
        private enum State
        {
            Waiting,
            RequestLine,
            HeaderLine,
            Body
        }

        /// <summary>
        /// The listened port.
        /// </summary>
        private SerialPort port;

        /// <summary>
        /// Flag indicating if the listen process has started.
        /// </summary>
        private bool started;

        /// <summary>
        /// <seealso cref="SerialListener.State"/>
        /// </summary>
        private State state;

        /// <summary>
        /// The previously received byte.
        /// </summary>
        private byte previous;

        /// <summary>
        /// The sequence of bytes that was received up until this point.
        /// </summary>
        private StringBuilder currentLine;

        /// <summary>
        /// The current (not yet finalized) request.
        /// </summary>
        private Request request;

        /// <summary>
        /// The name of the listened port.
        /// </summary>
        private String portName;

        private PortClosedHandler onPortClosed;

        /// <summary>
        /// <seealso cref="SerialListener.PortClosedHandler"/>
        /// </summary>
        internal PortClosedHandler OnPortClosed
        {
            get { return onPortClosed; }
            set { onPortClosed = value; }
        }

        private RequestReceivedHandler onRequestReceived;

        /// <summary>
        /// <seealso cref="SerialListener.RequestReceivedHandler"/>
        /// </summary>
        internal RequestReceivedHandler OnRequestReceived
        {
            get { return onRequestReceived; }
            set { onRequestReceived = value; }
        }

        public SerialListener(String portName)
        {
            this.started = false;
            this.currentLine = new StringBuilder();
            this.port = new SerialPort(portName);
            this.portName = portName;
        }

        /// <summary>
        /// Stops the listener.
        /// </summary>
        public void Close()
        {
            this.started = false;
        }

        /// <summary>
        /// Starts the listener. This method should be called in a different thread to not block the execution.
        /// </summary>
        public void Run()
        {
            try
            {
                port.Open();
                this.started = true;
                Discard();
                while (this.started)
                {
                    this.ProcessByte(port.ReadByte());
                }
            }
            catch (Exception)
            {
                if (onPortClosed != null)
                {
                    onPortClosed(this.portName, true);
                }
            }
            finally
            {
                if (port.IsOpen)
                {
                    try { 
                        port.Close();
                        onPortClosed(this.portName, false);
                    }
                    catch (IOException) {
                        onPortClosed(this.portName, true);
                    }
                }
            }
        }

        /// <summary>
        /// Performs the intialization of the FSM and parsing variables.
        /// </summary>
        private void Initialize()
        {
            previous = 0;
            currentLine.Clear();
            state = State.Waiting;
            request = null;
        }

        /// <summary>
        /// Processes a single byte.
        /// </summary>
        /// <param name="current">The latest read byte.</param>
        private void ProcessByte(int current)
        {
            if (current <= 0)
            {
                Initialize();
            }
            else
            {
                if (state == State.Waiting)
                {
                    state = State.RequestLine;
                }
                if (current != '\n' && current != '\r')
                {
                    currentLine.Append((char)current);
                }
                if (current == '\n' && previous == '\r')
                {
                    switch (state)
                    {
                        case State.RequestLine:
                            ProcessRequestLine();
                            state = State.HeaderLine;
                            break;
                        case State.HeaderLine:
                            if (currentLine.Length == 0)
                            {
                                if (request.Method == "GET" || request.Method == "DELETE") {
                                    FinalizeRequest();
                                }
                                else {
                                    state = State.Body;
                                }
                            }
                            else
                            {
                                ProcessHeaderLine();
                            }
                            break;
                        case State.Body:
                            ProcessBody();
                            FinalizeRequest();
                            break;
                    }
                }
                previous = (byte)current;
            }
        }

        /// <summary>
        /// Processes the request line stored in the currentLine member attribute.
        /// <seealso cref="SerialListener.currentLine"/>
        /// </summary>
        private void ProcessRequestLine()
        {
            string[] line = currentLine.ToString().Split(new char[]{ ' ' });
            currentLine.Clear();
            if (line.Length >= 2)
            {
                request = new Request(line[0], line[1]);
                request.Channel = portName;
            }
            else
            {
                Discard();
            }
        }


        /// <summary>
        /// Processes the header line stored in the currentLine member attribute.
        /// <seealso cref="SerialListener.currentLine"/>
        /// </summary>
        private void ProcessHeaderLine()
        {
            string[] line = currentLine.ToString().Split(new char[] { ':' });
            currentLine.Clear();
            if (line.Length >= 2)
            {
                request.Headers[line[0].Trim()] = line[1].Trim();
            }
        }


        /// <summary>
        /// Processes the body stored in the currentLine member attribute.
        /// <seealso cref="SerialListener.currentLine"/>
        /// </summary>
        private void ProcessBody()
        {
            request.Body = currentLine.ToString().Trim();
            currentLine.Clear();
        }


        /// <summary>
        /// Finalizes the current request and notifies the listner if any.
        /// </summary>
        private void FinalizeRequest()
        {
            if (onRequestReceived != null)
            {
                onRequestReceived(request);
            }
            Initialize();
        }

        /// <summary>
        /// Discards the remainder of the current request if it was malformed.
        /// </summary>
        private void Discard()
        {
            while (port.ReadByte() > 0) ;
            Initialize();
        }
    }
}
