using System.Threading.Tasks;
using ExternalLibrary;
using Newtonsoft.Json;

namespace QuickStart.Core
{
    class ExternalMethods
    {
        private readonly Library _library = new Library();

        public async Task<object> GetPersonInfo(dynamic input)
        {
            return await Task.Run(() =>JsonConvert.SerializeObject(_library.GetPerson(), Formatting.Indented));
        }
    }
}
