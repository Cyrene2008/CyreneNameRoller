using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Cyrene.Core.Bridge;

public sealed record UiElementDescriptor(
    string Kind,
    string Component,
    IReadOnlyDictionary<string, object?> Props,
    List<UiElementDescriptor>? Children)
{
    public UiElementDescriptor? FindById(string id)
    {
        if (Props.TryGetValue("Id", out var value) && value?.ToString() == id) return this;
        if (Children is null) return null;
        foreach (var child in Children)
        {
            var match = child.FindById(id);
            if (match is not null) return match;
        }
        return null;
    }
}

public static class UiTreeMapper
{
    private static readonly IReadOnlyDictionary<string, string> Controls = new Dictionary<string, string>
    {
        ["button"] = "Button",
        ["text-input"] = "TextBox",
        ["multiline-input"] = "TextBox",
        ["toggle"] = "ToggleSwitch",
        ["checkbox"] = "CheckBox",
        ["radio"] = "RadioButton",
        ["select"] = "ComboBox",
        ["slider"] = "Slider",
        ["number-stepper"] = "NumericUpDown",
        ["list"] = "ItemsControl",
        ["badge"] = "Border",
        ["icon"] = "SymbolIcon",
        ["progress"] = "ProgressBar",
        ["text"] = "TextBlock"
    };

    private static readonly IReadOnlyDictionary<string, string> Layouts = new Dictionary<string, string>
    {
        ["page"] = "UserControl",
        ["section"] = "StackPanel",
        ["card"] = "Border",
        ["group"] = "StackPanel",
        ["row"] = "StackPanel",
        ["column"] = "StackPanel",
        ["form"] = "StackPanel"
    };

    private static string ComponentFor(string kind)
    {
        if (Controls.TryGetValue(kind, out var control)) return control;
        if (Layouts.TryGetValue(kind, out var layout)) return layout;
        throw new InvalidOperationException($"渲染计划包含未映射的节点类型：{kind}");
    }

    public static UiElementDescriptor Map(string renderPlanJson)
    {
        var document = JsonNode.Parse(renderPlanJson)?.AsObject()
            ?? throw new InvalidOperationException("渲染计划无效");
        var root = document["root"]?.AsObject()
            ?? throw new InvalidOperationException("渲染计划缺少 root");
        return MapNode(root);
    }

    private static UiElementDescriptor MapNode(JsonObject node)
    {
        var kind = node["kind"]?.GetValue<string>()
            ?? throw new InvalidOperationException("渲染计划节点缺少 kind");
        var props = new Dictionary<string, object?>();
        foreach (var key in new[] { "id", "title", "titleEn", "label", "variant", "tone", "icon", "rows", "placeholder", "text" })
        {
            if (node[key] is JsonValue value) props[ToPascalCase(key)] = value.GetValue<string>();
        }
        foreach (var key in new[] { "min", "max", "step" })
        {
            if (node[key] is JsonValue value) props[ToPascalCase(key)] = value.GetValue<double>();
        }
        if (node["options"] is JsonArray options)
        {
            props["Options"] = options.Select(option => option?["value"]?.GetValue<string>() ?? string.Empty).ToList();
        }
        if (node["binding"]?["value"] is JsonValue bindingValue)
        {
            props["Value"] = ReadJsonValue(bindingValue);
        }
        List<UiElementDescriptor>? children = null;
        if (node["children"] is JsonArray childArray)
        {
            children = childArray.Select(child => MapNode(child!.AsObject())).ToList();
        }
        return new UiElementDescriptor(kind, ComponentFor(kind), props, children);
    }

    private static object ReadJsonValue(JsonValue value)
    {
        if (value.TryGetValue<bool>(out var boolean)) return boolean;
        if (value.TryGetValue<double>(out var number)) return number;
        return value.GetValue<string>();
    }

    private static string ToPascalCase(string key) => char.ToUpperInvariant(key[0]) + key[1..];
}

