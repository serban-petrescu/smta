using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace ProxyServer
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class View : Window
    {
        public View()
        {
            InitializeComponent();
            new Controller(webBrowser);
            String fileName = new System.IO.FileInfo("www/index.html").FullName;
            fileName = "file://127.0.0.1/" + fileName[0] + "$" + fileName.Substring(2).Replace('\\', '/');
            webBrowser.Source = new Uri(fileName);
        }
    }
}
