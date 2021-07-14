edge-cs
=======

This is a C# compiler for edge.js.

See [edge.js overview](http://tjanczuk.github.com/edge) and [edge.js on GitHub](https://github.com/tjanczuk/egde) for more information. 

## Building on Windows

1. [Install .NET Core SDK](https://www.microsoft.com/net/core#windows)  
2. [Install VS 2015 Community](https://www.visualstudio.com/products/free-developer-offers-vs)  
3. Build edge.js CSharp compiler for .NET Desktop (dll bundled with NPM package) 
  3.1. Make Release build of `src\edge-cs\edge-cs.sln` in VS  
  3.2. Copy `src\edge-cs\bin\Release\edge-cs.dll` to `lib`  
4. Build edge.js CSharp compiler for .NET Core (NuGet package)  
  4.1. Run `dotnet restore` in `src\Edge.js.CSharp`  
  4.2. Build Nuget package with `dotnet pack --configuration Release` in `src\Edge.js.CSharp`  
5. Upload `src\Edge.js.CSharp\bin\Release\Edge.js.CSharp.1.0.0.nupkg` to NuGet gallery through https://www.nuget.org/ (this enables .NET Core scripting)  
6. Install to NPM (this enables .NET Desktop/Mono scripting)  
