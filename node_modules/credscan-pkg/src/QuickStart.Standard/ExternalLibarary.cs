using System.Threading.Tasks;
using ExternlaLibrary.Standard;
using Newtonsoft.Json;

namespace QuickStart.Standard
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
