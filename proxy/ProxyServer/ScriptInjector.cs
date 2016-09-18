using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Windows.Controls;
using System.Security.Permissions;
using System.Runtime.InteropServices;
using System.Windows.Threading;
using System.Windows;

namespace ProxyServer
{
    /// <summary>
    /// Helper class which is used to inject code in the JavaScript window.external object.
    /// </summary>
    [ComVisible(true)]
    public class ScriptInjector : ScriptInjectorBase
    {
        /// <summary>
        /// Mapping between registered executors and their respective names.
        /// The names are used by the JavaScript calls to specify the desired operation to be executed.
        /// </summary>
        protected Dictionary<String, Execute> executors;

        public ScriptInjector(WebBrowser browser) : base(browser)
        {
            executors = new Dictionary<string, Execute>();
        }

        /// <summary>
        /// Registers a new executor for a given name.
        /// </summary>
        /// <param name="name">The name of the executor. </param>
        /// <param name="executor">The executor itself. </param>
        public void Register(String name, Execute executor)
        {
            executors.Add(name, executor);
        }

        /// <summary>
        /// Deletes the specified executor.
        /// </summary>
        /// <param name="name">The name of the executor to be deleted.</param>
        public void Unregister(String name)
        {
            executors.Remove(name);
        }

        /// <summary>
        /// Retrieves the necessary executor from the executor map.
        /// </summary>
        /// <param name="name">The name of the needed executor.</param>
        /// <returns>The necessary executor.</returns>
        protected override Execute GetExecutor(String name)
        {
            return executors[name];
        }
    }

    /// <summary>
    /// Base class for JavaScript helper objects.
    /// </summary>
    [ComVisible(true)]
    public abstract class ScriptInjectorBase
    {
        /// <summary>
        /// The browser which will run / host the JS code.
        /// </summary>
        protected WebBrowser browser;

        /// <summary>
        /// A lock object used to ensure that the JS calls are sent in a thread-safe manor.
        /// </summary>
        private object sendLock;

        public ScriptInjectorBase(WebBrowser browser)
        {
            this.browser = browser;
            this.sendLock = new object();
        }

        /// <summary>
        /// Asynchronous executor call. This method should be direcly used by the JavaScript code.
        /// The corresponding executor is executed in a separate Thread and the results are passed back
        /// to the JavaScript code via the given callback.
        /// </summary>
        /// <param name="method">The method which should be invoked. This is actually the name of the executor.</param>
        /// <param name="parameter">The parameter of the executor. This can be used to pass a JSON object if needed.</param>
        /// <param name="callback">The name of the global function which should be called to pass the results.</param>
        public void Async(String method, String parameter, String callback)
        {
            Execute executor = GetExecutor(method);
            new Call(this, callback, executor, parameter).RunAsync();
        }

        /// <summary>
        /// Synchronous executor call. This method should be direcly used by the JavaScript code.
        /// The corresponding executor is executed in the same Thread and the results are passed back
        /// to the JavaScript code via the given callback.
        /// </summary>
        /// <param name="method">The method which should be invoked. This is actually the name of the executor.</param>
        /// <param name="parameter">The parameter of the executor. This can be used to pass a JSON object if needed.</param>
        /// <param name="callback">The name of the global function which should be called to pass the results.</param>
        public void Sync(String method, String parameter, String callback)
        {
            Execute executor = GetExecutor(method);
            new Call(this, callback, executor, parameter).RunSync();
        }

        /// <summary>
        /// Retrieves the necessary executor.
        /// </summary>
        /// <param name="name">The name of the needed executor.</param>
        /// <returns>The necessary executor.</returns>
        protected abstract Execute GetExecutor(String method);

        /// <summary>
        /// Invokes a JavaScript global function.
        /// </summary>
        /// <param name="target">The name of the function.</param>
        /// <param name="results">The function's parameters.</param>
        [ComVisible(false)]
        public void Send(String target, String[] results)
        {
            lock (sendLock)
            {
                Application.Current.Dispatcher.Invoke(() => { browser.InvokeScript(target, results); });
            }
        }

        /// <summary>
        /// Sends the results from a call (either sync or async) to the JS code.
        /// </summary>
        /// <param name="call">The call whose results should be send.</param>
        protected void Send(Call call)
        {
            lock (sendLock)
            {
                Application.Current.Dispatcher.Invoke(() => { browser.InvokeScript(call.Target, call.Results); });
            }
        }

        /// <summary>
        /// Helper calls for encapsulating an executor call.
        /// </summary>
        protected class Call
        {
            private String target;

            /// <summary>
            /// The target JS function which should be called to pass the results.
            /// </summary>
            public String Target
            {
                get { return target; }
            }

            private String[] results;

            /// <summary>
            /// The results obtained from the executor.
            /// </summary>
            public String[] Results
            {
                get { return results; }
            }

            /// <summary>
            /// The parent ScriptInjector.
            /// </summary>
            private ScriptInjectorBase parent;

            /// <summary>
            /// The executor which is used to obtain the results.
            /// </summary>
            private Execute executor;

            /// <summary>
            /// The executor's parameter.
            /// </summary>
            private String parameter;

            public Call(ScriptInjectorBase parent, String target, Execute executor, String parameter = "")
            {
                this.target = target;
                this.parameter = parameter;
                this.parent = parent;
                this.executor = executor;
            }

            /// <summary>
            /// Runs the executor and sends the results back to the JS function asynchronously. 
            /// </summary>
            public void RunAsync()
            {
                Task.Factory.StartNew(() =>
                {
                    results = executor(parameter);
                    parent.Send(this);
                });
            }

            /// <summary>
            /// Runs the executor and sends the results back to the JS function synchronously. 
            /// </summary>
            public void RunSync()
            {
                results = executor(parameter);
                parent.Send(this);
            }

        }

    }


    /// <summary>
    /// Delegate type which represents a simple executor (operation).
    /// </summary>
    /// <param name="parameter">The parameter of the operation. In case the JS code needs to pass more than only 
    /// one parameter, a stringify'ed JSON object can also be passed.</param>
    /// <returns>An array of strings representing the operation's results.</returns>
    public delegate String[] Execute(String parameter);


}
